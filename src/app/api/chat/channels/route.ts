import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/api-auth";

export async function GET() {
  try {
    // Validate session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Fetch all channels
    const channels = await prisma.chatChannel.findMany({
      orderBy: { created_at: "asc" },
      include: {
        messages: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            content: true,
            sender_name: true,
            created_at: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    // Get read status for current user
    const readStatuses = await prisma.messageReadStatus.findMany({
      where: { user_id: user.id },
    });

    const readStatusMap = new Map(
      readStatuses.map((rs) => [rs.channel_id, rs.last_read_at])
    );

    // Calculate unread count for each channel
    const channelsWithUnread = await Promise.all(
      channels.map(async (channel) => {
        const lastReadAt = readStatusMap.get(channel.id);

        // Count messages after last read
        const unreadCount = lastReadAt
          ? await prisma.chatMessage.count({
              where: {
                channel_id: channel.id,
                created_at: { gt: lastReadAt },
              },
            })
          : channel._count.messages;

        const lastMessage = channel.messages[0];

        return {
          id: channel.id,
          name: channel.name,
          slug: channel.slug,
          type: channel.type,
          description: channel.description,
          unread_count: unreadCount,
          last_message: lastMessage
            ? {
                content:
                  lastMessage.content.length > 100
                    ? lastMessage.content.slice(0, 100) + "..."
                    : lastMessage.content,
                sender_name: lastMessage.sender_name,
                created_at: lastMessage.created_at.toISOString(),
              }
            : null,
        };
      })
    );

    return NextResponse.json(
      { success: true, channels: channelsWithUnread },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching chat channels:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
