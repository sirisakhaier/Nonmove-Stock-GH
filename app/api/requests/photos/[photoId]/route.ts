import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const photo = await prisma.requestPhoto.findUnique({
      where: { id: params.photoId },
    });

    if (!photo || !photo.url) {
      return new Response("Photo not found", { status: 404 });
    }

    // 1. Data URL
    if (photo.url.startsWith("data:image/")) {
      const match = photo.url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        const mimeType = `image/${match[1]}`;
        const buffer = Buffer.from(match[2], "base64");
        return new Response(buffer, {
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // 2. HTTP URL (Redirect directly)
    if (photo.url.startsWith("http://") || photo.url.startsWith("https://")) {
      return NextResponse.redirect(photo.url);
    }

    // 3. Fallback
    return new Response("Invalid image data", { status: 400 });
  } catch (error: any) {
    console.error("Error serving photo:", error);
    return new Response("Failed to load photo", { status: 500 });
  }
}
