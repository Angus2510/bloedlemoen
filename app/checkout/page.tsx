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
  message?: string;
}

// Zod schema for form validation
const deliveryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  addressLine1: z.string().min(5, "Please enter a valid address"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Please enter a valid city"),
  province: z.string().min(2, "Please enter a valid province"),
  postalCode: z.string().min(4, "Please enter a valid postal code"),
  country: z.string().min(2, "Please enter a valid country"),
});

type DeliveryFormData = z.infer<typeof deliveryFormSchema>;

export default function CheckoutPage() {
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
        const result: CreateOrderResponse = await response.json();
        alert(
          `🎉 Order placed successfully! Order #${result.orderId}. Your rewards will be shipped to the provided address.`
        );
        router.push("/dashboard");
      } else {
        const error: ErrorResponse = await response.json();
        alert(`Order failed: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Failed to place order. Please try again.");
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

  if (!userData || userData.points < totalPoints) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              Insufficient Points
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              You need {totalPoints} points but only have{" "}
              {userData?.points || 0} points.
            </p>
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
              BACK TO REWARDS
            </Button>
            <h1 className="text-lg md:text-xl font-heading">CHECKOUT</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Package className="size-5" />
                ORDER SUMMARY
              </CardTitle>
              <CardDescription>Review your selected rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checkoutItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                      <p className="text-xs">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {item.points * item.quantity} pts
                      </p>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <p className="font-heading">TOTAL POINTS</p>
                    <p className="font-bold text-lg text-primary">
                      {totalPoints} pts
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <p>Your Points</p>
                    <p>{userData.points} pts</p>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <p>Remaining After Order</p>
                    <p className="font-medium">
                      {userData.points - totalPoints} pts
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Truck className="size-5" />
                DELIVERY INFORMATION
              </CardTitle>
              <CardDescription>
                Where should we send your rewards?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+27 XX XXX XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1 *</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
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
                          <Input placeholder="Apartment, suite, etc. (optional)" {...field} />
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
                            <Input placeholder="0000" {...field} />
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
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input disabled {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-6"
                    size="lg"
                  >
                    {submitting
                      ? "PLACING ORDER..."
                      : `PLACE ORDER (${totalPoints} POINTS)`}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
