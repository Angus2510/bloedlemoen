import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const {
      ocrText,
      storeName,
      totalAmount,
      detectedItems,
      pointsEarned,
      imagePath,
    } = body;

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create the receipt record
    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        imagePath: imagePath || `receipt_${Date.now()}`, // Placeholder for image path
        ocrText,
        storeName,
        totalAmount: totalAmount ? parseFloat(totalAmount) : null,
        detectedItems: detectedItems || [],
        pointsEarned: pointsEarned || 0,
        isVerified: true, // Auto-verify for now
        verifiedAt: new Date(),
      },
    });

    // Update user's points
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        points: { increment: pointsEarned || 0 },
        totalEarned: { increment: pointsEarned || 0 },
      },
      select: {
        points: true,
        totalEarned: true,
      },
    });

    // Create campaign event for analytics
    await prisma.campaignEvent.create({
      data: {
        userId: user.id,
        eventType: "RECEIPT_UPLOADED",
        metadata: {
          receiptId: receipt.id,
          pointsEarned: pointsEarned || 0,
          storeName,
          detectedItems: detectedItems || [],
        },
      },
    });

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        pointsEarned: receipt.pointsEarned,
        storeName: receipt.storeName,
        createdAt: receipt.createdAt,
      },
      userPoints: updatedUser.points,
      totalEarned: updatedUser.totalEarned,
    });
  } catch (error) {
    console.error("Receipt upload error:", error);
    return NextResponse.json(
      { error: "Failed to save receipt" },
      { status: 500 }
    );
  }
}
