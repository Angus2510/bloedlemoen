import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
    const recentActivity = user.receipts.map((receipt) => ({
      id: receipt.id,
      type: "receipt_upload",
      description: `Receipt from ${receipt.storeName || "Unknown Store"}`,
      points: receipt.pointsEarned,
      items: receipt.detectedItems,
      verified: receipt.isVerified,
      date: receipt.createdAt,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
        totalEarned: user.totalEarned,
        memberSince: user.createdAt,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
