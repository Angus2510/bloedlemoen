import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ReceiptProcessRequest {
  ocrText: string;
  storeName?: string | null;
  totalAmount?: string | null; // Comes as string from frontend
  detectedItems?: string[];
  pointsEarned: number;
}

interface ReceiptProcessResponse {
  success: boolean;
  receipt: {
    id: string;
    userId: string;
    imagePath: string;
    ocrText: string | null; // Can be null in database
    storeName: string | null;
    totalAmount: number | null;
    detectedItems: string[];
    pointsEarned: number;
    isVerified: boolean;
    verifiedAt: Date | null;
    createdAt: Date;
  };
  newPointsBalance: number;
  pointsEarned: number;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ReceiptProcessResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ReceiptProcessRequest = await request.json();
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

    // Convert totalAmount from string to number
    const totalAmountNumber = totalAmount ? parseFloat(totalAmount) : null;

    // Create the receipt record
    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        imagePath: "", // No image saved, just empty string
        ocrText: ocrText,
        storeName: storeName || null,
        totalAmount: totalAmountNumber,
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
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
