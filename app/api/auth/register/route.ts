import { NextRequest, NextResponse } from "next/server";
// import bcrypt from "bcryptjs"; // TODO: Re-enable after Prisma regeneration
import { prisma } from "@/lib/prisma";

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
}

interface ErrorResponse {
  error: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<RegisterResponse | ErrorResponse>> {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // TODO: Hash and store password after Prisma client regeneration
    // const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    // TODO: Store hashed password after Prisma client regeneration
    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        // password: hashedPassword, // TODO: Enable after Prisma regeneration
        points: 0,
        totalEarned: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
