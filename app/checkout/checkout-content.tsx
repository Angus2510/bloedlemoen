"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Package, Truck } from "lucide-react";

interface CheckoutItem {
  id: number;
  name: string;
  points: number;
  quantity: number;
  category: string;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  points: number;
}

interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  newPointsBalance: number;
  message: string;
}

interface ErrorResponse {
  error: string;
}

// Delivery form validation schema
const deliveryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  addressLine1: z.string().min(5, "Please enter a valid address"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Please enter a valid city"),
  province: z.string().min(2, "Please enter a valid province"),
  postalCode: z.string().min(4, "Please enter a valid postal code"),
  country: z.string().min(2, "Please enter a valid country"),
});

type DeliveryFormData = z.infer<typeof deliveryFormSchema>;

export default function CheckoutContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize React Hook Form
  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      province: "",
      postalCode: "",
      country: "South Africa",
    },
  });

  // Calculate total points
  const totalPoints = checkoutItems.reduce(
    (sum, item) => sum + item.points * item.quantity,
    0
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/data");
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          // Pre-fill form with user data using React Hook Form
          form.setValue("name", data.user.name || "");
          form.setValue("email", data.user.email || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    // Parse selected items from URL params
    const itemsParam = searchParams.get("items");
    if (itemsParam) {
      try {
        const items = JSON.parse(decodeURIComponent(itemsParam));
        setCheckoutItems(items);
      } catch (error) {
        console.error("Error parsing checkout items:", error);
        router.push("/redeem");
        return;
      }
    } else {
      router.push("/redeem");
      return;
    }

    if (session?.user) {
      fetchUserData();
    }
    setLoading(false);
  }, [session, searchParams, router, form]);

  const onSubmit = async (data: DeliveryFormData) => {
    if (!userData || userData.points < totalPoints) {
      alert("Insufficient points for this order.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: checkoutItems,
          deliveryInfo: data,
          totalPoints: totalPoints,
        }),
      });

      if (response.ok) {
        // Redirect to confirmation page instead of showing alert
        router.push("/checkout/confirmation");
      } else {
        const errorResult: ErrorResponse = await response.json();
        alert(`Order failed: ${errorResult.error}`);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Items Selected</CardTitle>
            <CardDescription>
              Please select rewards to checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/redeem")} className="w-full">
              Back to Rewards
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-xs md:text-sm"
            >
              <ArrowLeft className="size-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">BACK TO REWARDS</span>
              <span className="sm:hidden">BACK</span>
            </Button>
            <h1 className="text-lg md:text-xl font-heading">CHECKOUT</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-lg md:text-xl font-normal">
                <Package className="size-4 md:size-5" />
                ORDER SUMMARY
              </CardTitle>
              <CardDescription>
                Review your selected rewards before checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkoutItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-sm leading-tight">
                      {item.name.toUpperCase()}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.category} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {item.points * item.quantity} points
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.points} each
                    </p>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading text-lg">TOTAL</p>
                    <p className="text-sm text-muted-foreground">
                      {checkoutItems.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )}{" "}
                      item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-primary">
                      {totalPoints} points
                    </p>
                    {userData && (
                      <p className="text-sm text-muted-foreground">
                        {userData.points - totalPoints} points remaining
                      </p>
                    )}
                  </div>
                </div>

                {/* Point balance warning */}
                {userData && userData.points < totalPoints && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Insufficient Points
                    </p>
                    <p className="text-sm text-red-600">
                      You need {totalPoints - userData.points} more points to
                      complete this order.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-lg md:text-xl font-normal">
                <Truck className="size-4 md:size-5" />
                DELIVERY INFORMATION
              </CardTitle>
              <CardDescription>
                Enter your delivery details for your rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Personal Information</h3>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your full name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="Enter your phone number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Delivery Address</h3>

                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1 *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Street address, building number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Apartment, suite, unit (optional)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province *</FormLabel>
                            <FormControl>
                              <Input placeholder="Province" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="Postal Code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={
                        submitting || !userData || userData.points < totalPoints
                      }
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Processing...
                        </>
                      ) : (
                        `COMPLETE ORDER (${totalPoints} points)`
                      )}
                    </Button>

                    {userData && userData.points >= totalPoints && (
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        Your rewards will be delivered within 7-10 business days
                      </p>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
