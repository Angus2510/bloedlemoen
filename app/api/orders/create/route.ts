import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import sendEmailNotification from "@/lib/email";

interface CheckoutItem {
  id: number;
  name: string;
  points: number;
  quantity: number;
  category: string;
}

interface DeliveryInfo {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface CreateOrderRequest {
  items: CheckoutItem[];
  deliveryInfo: DeliveryInfo;
  totalPoints: number;
}

interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  newPointsBalance: number;
  message: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
  userPoints?: number;
  requiredPoints?: number;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateOrderResponse | ErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" } as ErrorResponse, {
        status: 401,
      });
    }

    const requestBody: CreateOrderRequest = await request.json();
    const { items, deliveryInfo, totalPoints } = requestBody;

    // Validate input
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in order" } as ErrorResponse,
        { status: 400 }
      );
    }

    if (
      !deliveryInfo.name ||
      !deliveryInfo.addressLine1 ||
      !deliveryInfo.city ||
      !deliveryInfo.province ||
      !deliveryInfo.postalCode
    ) {
      return NextResponse.json(
        { error: "Missing required delivery information" } as ErrorResponse,
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" } as ErrorResponse, {
        status: 404,
      });
    }

    // Check if user has enough points
    if (user.points < totalPoints) {
      return NextResponse.json(
        {
          error: "Insufficient points",
          userPoints: user.points,
          requiredPoints: totalPoints,
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // For now, let's simplify and just create redemptions without orders
    // We can add the Order model later when the database is properly synced
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Create redemptions for each item (without order for now)
        const redemptions = await Promise.all(
          items.map((item: CheckoutItem) =>
            tx.redemption.create({
              data: {
                userId: user.id,
                rewardId: item.id.toString(), // Convert to string for the schema
                // orderId: null, // Skip order for now
                pointsUsed: item.points * item.quantity, // Total points for this item
                // quantity: item.quantity, // Skip quantity if not in schema
                status: "PENDING",
              },
            })
          )
        );

        // Deduct points from user
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            points: user.points - totalPoints,
          },
        });

        return {
          orderId: `temp-${Date.now()}`, // Temporary order ID
          redemptions,
          updatedUser,
        };
      }
    );

    // Send confirmation email to user
    const userEmail = deliveryInfo.email || user.email;
    if (userEmail) {
      const userEmailHtml = `
        <h1>Your Bloedlemoen Rewards Order Confirmation</h1>
        <p>Thank you for redeeming your points! Your order has been placed successfully.</p>
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> ${result.orderId}</p>
        <h2>Items Received:</h2>
        <ul>
          ${items
            .map(
              (item) =>
                `<li>${item.name} - Quantity: ${item.quantity} (${
                  item.points * item.quantity
                } points)</li>`
            )
            .join("")}
        </ul>
        <p><strong>Total Points Used:</strong> ${totalPoints}</p>
        <h2>Delivery Information:</h2>
        <p><strong>Name:</strong> ${deliveryInfo.name}</p>
        <p><strong>Email:</strong> ${deliveryInfo.email || "N/A"}</p>
        <p><strong>Phone:</strong> ${deliveryInfo.phone || "N/A"}</p>
        <p><strong>Address:</strong> ${deliveryInfo.addressLine1}${
        deliveryInfo.addressLine2 ? ", " + deliveryInfo.addressLine2 : ""
      }</p>
        <p><strong>City:</strong> ${deliveryInfo.city}</p>
        <p><strong>Province:</strong> ${deliveryInfo.province}</p>
        <p><strong>Postal Code:</strong> ${deliveryInfo.postalCode}</p>
        <p><strong>Country:</strong> ${deliveryInfo.country}</p>
        <p>Your rewards will be delivered within 7-10 business days.</p>
        <p>If you have any questions, please contact us at info@cutlerdrinks.co.za</p>
      `;
      try {
        await sendEmailNotification(
          userEmail,
          "Your Bloedlemoen Rewards Order Confirmation",
          userEmailHtml
        );
      } catch (emailError) {
        console.error("Failed to send user confirmation email:", emailError);
      }
    }

    // Send notification email to admin
    const adminEmailHtml = `
      <h1>New Order Received</h1>
      <h2>User Information:</h2>
      <p><strong>Name:</strong> ${user.name || "N/A"}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Phone:</strong> ${deliveryInfo.phone || "N/A"}</p>
      <h2>Delivery Information:</h2>
      <p><strong>Name:</strong> ${deliveryInfo.name}</p>
      <p><strong>Email:</strong> ${deliveryInfo.email || "N/A"}</p>
      <p><strong>Phone:</strong> ${deliveryInfo.phone || "N/A"}</p>
      <p><strong>Address:</strong> ${deliveryInfo.addressLine1}${
      deliveryInfo.addressLine2 ? ", " + deliveryInfo.addressLine2 : ""
    }</p>
      <p><strong>City:</strong> ${deliveryInfo.city}</p>
      <p><strong>Province:</strong> ${deliveryInfo.province}</p>
      <p><strong>Postal Code:</strong> ${deliveryInfo.postalCode}</p>
      <p><strong>Country:</strong> ${deliveryInfo.country}</p>
      <h2>Order Details:</h2>
      <p><strong>Order ID:</strong> ${result.orderId}</p>
      <ul>
        ${items
          .map(
            (item) =>
              `<li>${item.name} - Quantity: ${item.quantity} (${
                item.points * item.quantity
              } points)</li>`
          )
          .join("")}
      </ul>
      <p><strong>Total Points Used:</strong> ${totalPoints}</p>
      <p><strong>Remaining Points:</strong> ${result.updatedUser.points}</p>
    `;
    try {
      await sendEmailNotification(
        "info@cutlerdrinks.co.za",
        `New Order from ${deliveryInfo.name}`,
        adminEmailHtml
      );
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      newPointsBalance: result.updatedUser.points,
      message: "Order placed successfully",
    } as CreateOrderResponse);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ErrorResponse,
      { status: 500 }
    );
  }
}
