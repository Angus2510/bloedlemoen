import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ocrText, storeName, totalAmount, detectedItems, pointsEarned } =
      body;

    // Validate required fields
    if (!ocrText || pointsEarned === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: ocrText, pointsEarned" },
        { status: 400 }
      );
    }

    // Find user by email
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
        imagePath: "", // No image saved, just empty string
        ocrText: ocrText,
        storeName: storeName || null,
        totalAmount: totalAmount || null,
        detectedItems: detectedItems || [],
        pointsEarned: pointsEarned,
        isVerified: true, // Auto-verify for now
        verifiedAt: new Date(),
      },
    });

    // Update user's points
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        points: {
          increment: pointsEarned,
        },
        totalEarned: {
          increment: pointsEarned,
        },
      },
    });

    return NextResponse.json({
      success: true,
      receipt: receipt,
      newPointsBalance: updatedUser.points,
      pointsEarned: pointsEarned,
    });
  } catch (error) {
    console.error("Error processing receipt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
