import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, validateAnyApiKey } from "@/lib/api-auth";
import { extractMentions, triggerMentionedAgents } from "@/lib/agent-mentions";
import { z } from "zod";

// Validation schema for POST request
const sendMessageSchema = z.object({
  channel_id: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  sender_type: z.enum(["USER", "QA_AGENT", "DEV_AGENT", "MOBILE_QA_AGENT", "SYSTEM"]).optional(),
  sender_id: z.string().optional(),
  sender_name: z.string().optional(),
  message_type: z
    .enum([
      "TEXT",
      "BUG_REPORT",
      "PR_CREATED",
      "TEST_RESULT",
      "TASK_ASSIGNED",
      "TASK_COMPLETED",
      "STATUS_UPDATE",
      "CODE_SNIPPET",
    ])
    .optional()
    .default("TEXT"),
  mentions: z.array(z.string()).optional(),
  screenshots: z.array(z.string()).optional(),
  video_url: z.string().optional(),
  pr_url: z.string().optional(),
  test_run_id: z.string().optional(),
  commit_hash: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Validate session or API key
    const user = await getSessionUser();
    const apiKeyAuth = !user ? await validateAnyApiKey(request) : null;

    if (!user && !apiKeyAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in or provide valid API key." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channel_id");
    const channelSlug = searchParams.get("channel_slug");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const before = searchParams.get("before"); // Message ID for cursor pagination
    const after = searchParams.get("after"); // Timestamp for polling new messages

    if (!channelId && !channelSlug) {
      return NextResponse.json(
        { success: false, error: "channel_id or channel_slug is required" },
        { status: 400 }
      );
    }

    // Resolve channel
    const channel = channelId
      ? await prisma.chatChannel.findUnique({ where: { id: channelId } })
      : await prisma.chatChannel.findUnique({ where: { slug: channelSlug! } });

    if (!channel) {
      return NextResponse.json(
        { success: false, error: "Channel not found" },
        { status: 404 }
      );
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { channel_id: channel.id };

    if (before) {
      // Get the created_at of the cursor message
      const cursorMessage = await prisma.chatMessage.findUnique({
        where: { id: before },
        select: { created_at: true },
      });
      if (cursorMessage) {
        where.created_at = { lt: cursorMessage.created_at };
      }
    }

    if (after) {
      // Parse ISO timestamp
      const afterDate = new Date(after);
      if (!isNaN(afterDate.getTime())) {
        where.created_at = { gt: afterDate };
      }
    }

    // Fetch messages
    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit + 1, // Fetch one extra to check if there are more
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, -1) : messages;

    // Reverse to chronological order (oldest first)
    resultMessages.reverse();

    const formattedMessages = resultMessages.map((msg) => ({
      id: msg.id,
      channel_id: msg.channel_id,
      sender_type: msg.sender_type,
      sender_id: msg.sender_id,
      sender_name: msg.sender_name,
      content: msg.content,
      message_type: msg.message_type,
      mentions: msg.mentions,
      screenshots: msg.screenshots,
      video_url: msg.video_url,
      pr_url: msg.pr_url,
      test_run_id: msg.test_run_id,
      commit_hash: msg.commit_hash,
      metadata: msg.metadata,
      is_read: msg.is_read,
      created_at: msg.created_at.toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        messages: formattedMessages,
        has_more: hasMore,
        cursor: resultMessages.length > 0 ? resultMessages[0].id : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate session or API key
    const user = await getSessionUser();
    const apiKeyAuth = !user ? await validateAnyApiKey(request) : null;

    if (!user && !apiKeyAuth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in or provide valid API key." },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Resolve channel (default to "general")
    const channelSlug = data.channel_id || "general";
    let channel = await prisma.chatChannel.findUnique({
      where: { slug: channelSlug },
    });

    // If channel_id looks like an ID, try finding by ID
    if (!channel && data.channel_id) {
      channel = await prisma.chatChannel.findUnique({
        where: { id: data.channel_id },
      });
    }

    if (!channel) {
      return NextResponse.json(
        { success: false, error: `Channel "${channelSlug}" not found` },
        { status: 404 }
      );
    }

    // Determine sender info
    let senderType = data.sender_type;
    let senderId = data.sender_id;
    let senderName = data.sender_name;

    if (user) {
      // User is sending via session
      senderType = senderType || "USER";
      senderId = senderId || user.id;
      senderName = senderName || user.name || "User";
    } else if (apiKeyAuth?.type === "agent" && apiKeyAuth.agent) {
      // Agent is sending via API key
      const agentName = apiKeyAuth.agent.name.toLowerCase();
      if (agentName.includes("qa") && !agentName.includes("mobile")) {
        senderType = senderType || "QA_AGENT";
      } else if (agentName.includes("dev")) {
        senderType = senderType || "DEV_AGENT";
      } else if (agentName.includes("mobile")) {
        senderType = senderType || "MOBILE_QA_AGENT";
      } else {
        senderType = senderType || "QA_AGENT";
      }
      senderId = senderId || apiKeyAuth.agent.id;
      senderName = senderName || apiKeyAuth.agent.name;
    } else {
      // Master API key - use provided values or defaults
      senderType = senderType || "SYSTEM";
      senderName = senderName || "System";
    }

    // Extract @mentions from content
    const detectedMentions = extractMentions(data.content);
    const allMentions = [...new Set([...(data.mentions || []), ...detectedMentions])];

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        channel_id: channel.id,
        sender_type: senderType,
        sender_id: senderId,
        sender_name: senderName,
        content: data.content,
        message_type: data.message_type,
        mentions: allMentions,
        screenshots: data.screenshots || [],
        video_url: data.video_url,
        pr_url: data.pr_url,
        test_run_id: data.test_run_id,
        commit_hash: data.commit_hash,
        metadata: data.metadata as object | undefined,
      },
    });

    // Trigger mentioned agents asynchronously (non-blocking)
    const notifiedAgents: string[] = [];
    if (allMentions.length > 0) {
      // Get recent messages for context
      const recentMessages = await prisma.chatMessage.findMany({
        where: { channel_id: channel.id },
        orderBy: { created_at: "desc" },
        take: 10,
      });

      // Trigger agents in background
      triggerMentionedAgents(message, recentMessages.reverse()).catch((err) => {
        console.error("Error triggering mentioned agents:", err);
      });

      notifiedAgents.push(...allMentions);
    }

    return NextResponse.json(
      {
        success: true,
        message: {
          id: message.id,
          channel_id: message.channel_id,
          sender_type: message.sender_type,
          sender_id: message.sender_id,
          sender_name: message.sender_name,
          content: message.content,
          message_type: message.message_type,
          mentions: message.mentions,
          screenshots: message.screenshots,
          video_url: message.video_url,
          pr_url: message.pr_url,
          test_run_id: message.test_run_id,
          commit_hash: message.commit_hash,
          metadata: message.metadata,
          is_read: message.is_read,
          created_at: message.created_at.toISOString(),
        },
        mentioned_agents_notified: notifiedAgents,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending chat message:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
