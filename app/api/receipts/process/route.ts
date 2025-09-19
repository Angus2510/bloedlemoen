import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

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
    // receiptHash: string | null; // TODO: Re-enable after Prisma regeneration
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

// Function to create a hash of the receipt content for duplicate detection
function createReceiptHash(
  ocrText: string,
  totalAmount?: string | null
): string {
  // Clean the text by removing timestamps, reference numbers, and other dynamic content
  const cleanedText = ocrText
    .toLowerCase()
    .replace(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}/g, "") // Remove dates
    .replace(/\d{2}:\d{2}(:\d{2})?/g, "") // Remove times
    .replace(/ref[\s:]*\d+/gi, "") // Remove reference numbers
    .replace(/transaction[\s:]*\d+/gi, "") // Remove transaction IDs
    .replace(/receipt[\s:]*\d+/gi, "") // Remove receipt numbers
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Include total amount in hash if available (for extra uniqueness)
  const hashContent = totalAmount
    ? `${cleanedText}|${totalAmount}`
    : cleanedText;

  return createHash("sha256").update(hashContent).digest("hex");
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

    // Create receipt hash to check for duplicates
    // const receiptHash = createReceiptHash(ocrText, totalAmount); // TODO: Re-enable after Prisma regeneration

    // TODO: Re-enable duplicate check after regenerating Prisma client
    // Check if this receipt hash already exists for any user
    // const existingReceipt = await prisma.receipt.findFirst({
    //   where: {
    //     receiptHash: receiptHash,
    //   },
    //   include: {
    //     user: {
    //       select: {
    //         email: true,
    //         name: true,
    //       },
    //     },
    //   },
    // });

    // if (existingReceipt) {
    //   // Receipt already exists - return error with details
    //   const isOwnReceipt = existingReceipt.userId === user.id;

    //   return NextResponse.json(
    //     {
    //       error: isOwnReceipt
    //         ? "You have already uploaded this receipt. Each receipt can only be submitted once."
    //         : "This receipt has already been submitted by another user. Each receipt can only be used once across all accounts.",
    //     },
    //     { status: 409 } // Conflict status code
    //   );
    // }

    // Convert totalAmount from string to number
    const totalAmountNumber = totalAmount ? parseFloat(totalAmount) : null;

    // Create the receipt record
    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        imagePath: "", // No image saved, just empty string
        ocrText: ocrText,
        // receiptHash: receiptHash, // TODO: Re-enable after Prisma regeneration
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
