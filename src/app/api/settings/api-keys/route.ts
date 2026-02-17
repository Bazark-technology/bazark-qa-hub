import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getSessionUser,
  isAdminSession,
  generateApiKey,
  maskApiKey,
} from "@/lib/api-auth";

const createApiKeySchema = z.object({
  label: z.string().min(1, "Label is required").max(100),
  expires_at: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate session and admin role
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = createApiKeySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { label, expires_at } = validationResult.data;

    // Generate new API key
    const key = generateApiKey();

    // Create API key record
    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        label,
        created_by_id: user.id,
        expires_at: expires_at ? new Date(expires_at) : null,
      },
      select: {
        id: true,
        label: true,
        created_at: true,
        expires_at: true,
      },
    });

    // Return the key only once - it won't be shown again
    return NextResponse.json(
      {
        success: true,
        api_key: {
          ...apiKey,
          key, // Only returned on creation
        },
        message:
          "API key created successfully. Save this key - it won't be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Validate session and admin role
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Fetch all API keys
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        key: true,
        label: true,
        is_active: true,
        last_used: true,
        expires_at: true,
        created_at: true,
        created_by: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Mask the keys and rename to masked_key
    const maskedApiKeys = apiKeys.map((apiKey) => ({
      id: apiKey.id,
      masked_key: maskApiKey(apiKey.key),
      label: apiKey.label,
      is_active: apiKey.is_active,
      last_used: apiKey.last_used,
      created_at: apiKey.created_at,
      created_by: apiKey.created_by,
    }));

    return NextResponse.json(
      { success: true, api_keys: maskedApiKeys },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
