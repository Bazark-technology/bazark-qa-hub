import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/api-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate session and admin role
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Check API key exists
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key not found" },
        { status: 404 }
      );
    }

    // Revoke the API key (soft delete)
    await prisma.apiKey.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json(
      {
        success: true,
        message: "API key revoked successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
