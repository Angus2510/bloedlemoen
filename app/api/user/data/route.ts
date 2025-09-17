import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ReceiptSelect {
  id: string;
  storeName: string | null;
  pointsEarned: number;
  detectedItems: string[];
  isVerified: boolean;
  createdAt: Date;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  points: number;
  items: string[];
  verified: boolean;
  date: Date;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  points: number;
  totalEarned: number;
  memberSince: Date;
}

interface UserDataResponse {
  user: UserData;
  recentActivity: ActivityItem[];
}

export async function GET(): Promise<
  NextResponse<UserDataResponse | { error: string }>
> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        totalEarned: true,
        createdAt: true,
        receipts: {
          orderBy: { createdAt: "desc" },
          take: 10, // Last 10 receipts for recent activity
          select: {
            id: true,
            storeName: true,
            pointsEarned: true,
            detectedItems: true,
            isVerified: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format recent activity for display
    const recentActivity: ActivityItem[] = user.receipts.map(
      (receipt: ReceiptSelect) => ({
        id: receipt.id,
        type: "receipt_upload",
        description: `Receipt from ${receipt.storeName || "Unknown Store"}`,
        points: receipt.pointsEarned,
        items: receipt.detectedItems,
        verified: receipt.isVerified,
        date: receipt.createdAt,
      })
    );

    const userData: UserData = {
      id: user.id,
      name: user.name,
      email: user.email,
      points: user.points,
      totalEarned: user.totalEarned,
      memberSince: user.createdAt,
    };

    return NextResponse.json({
      user: userData,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
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
