import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/api-auth";
import { z } from "zod";

const markReadSchema = z.object({
  channel_id: z.string().min(1, "channel_id is required"),
  up_to: z.string().optional(), // Message ID - mark all up to this one
});

export async function POST(request: NextRequest) {
  try {
    // Validate session - only users can mark messages as read
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = markReadSchema.safeParse(body);

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

    const { channel_id, up_to } = validation.data;

    // Resolve channel (by ID or slug)
    let channel = await prisma.chatChannel.findUnique({
      where: { id: channel_id },
    });

    if (!channel) {
      channel = await prisma.chatChannel.findUnique({
        where: { slug: channel_id },
      });
    }

    if (!channel) {
      return NextResponse.json(
        { success: false, error: "Channel not found" },
        { status: 404 }
      );
    }

    // Determine the read timestamp
    let lastReadAt = new Date();

    if (up_to) {
      // Get the created_at of the specified message
      const message = await prisma.chatMessage.findUnique({
        where: { id: up_to },
        select: { created_at: true },
      });

      if (message) {
        lastReadAt = message.created_at;
      }
    }

    // Upsert read status
    await prisma.messageReadStatus.upsert({
      where: {
        user_id_channel_id: {
          user_id: user.id,
          channel_id: channel.id,
        },
      },
      update: {
        last_read_at: lastReadAt,
      },
      create: {
        user_id: user.id,
        channel_id: channel.id,
        last_read_at: lastReadAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Messages marked as read",
        last_read_at: lastReadAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
