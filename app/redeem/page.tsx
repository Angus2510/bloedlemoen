"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Gift, Lock } from "lucide-react";
import Image from "next/image";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  points: number;
  totalEarned: number;
  memberSince: string;
}

// Available rewards data
const rewards = [
  {
    id: 1,
    name: "Alkaline: Stackable Candle Holders (set of 2)",
    description:
      "Elegant stackable candle holders in a selection of 4 colors. Perfect for creating ambient lighting.",
    points: 100,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Home Decor",
  },
  {
    id: 2,
    name: "Alkaline: Stackable Candle Holders (set of 4)",
    description:
      "Complete set of 4 stackable candle holders in a selection of 4 colors. Create beautiful lighting arrangements.",
    points: 200,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Home Decor",
  },
  {
    id: 3,
    name: "Alkaline: Coasters (set of 4)",
    description:
      "Premium coasters in a selection of 2 colors. Protect your surfaces in style.",
    points: 250,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Home Decor",
  },
  {
    id: 4,
    name: "Alkaline: Coasters (set of 2)",
    description:
      "Stylish coasters in a selection of 2 colors. Essential for any home bar setup.",
    points: 150,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Home Decor",
  },
  {
    id: 5,
    name: "Okra: Dinner Candles, 40 cm (set of 2)",
    description:
      "Elegant 40cm dinner candles in various colors. Perfect for special occasions and intimate dining.",
    points: 100,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Candles",
  },
  {
    id: 6,
    name: "Okra: Everyday Candles (set of 4)",
    description:
      "Set of 4 everyday candles in various colors. Create a cozy atmosphere for any occasion.",
    points: 200,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Candles",
  },
  {
    id: 7,
    name: "Okra: GEAR LARGE",
    description:
      "Premium GEAR LARGE piece in various colors. A statement piece for modern living.",
    points: 150,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Home Accessories",
  },
  {
    id: 8,
    name: "Okra: Bead Candle Pent (set of 2)",
    description:
      "Unique bead candle pent set in various colors. Add artistic flair to your candle collection.",
    points: 150,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Candles",
  },
  {
    id: 9,
    name: "Bodega Mini Tumblers (set of 4)",
    description:
      "Premium mini tumblers perfect for spirits and cocktails. Essential for any home bar.",
    points: 250,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Barware",
  },
  {
    id: 10,
    name: "Mia Melange Placemats (set of 2)",
    description:
      "Elegant Mia Melange placemats to elevate your dining experience. Perfect for special occasions.",
    points: 300,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Table Setting",
  },
  {
    id: 11,
    name: "The Cotton Company Cocktail Napkins (set of 2)",
    description:
      "Premium smaller cocktail napkins from The Cotton Company. Perfect for elegant entertaining.",
    points: 200,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Table Setting",
  },
  {
    id: 12,
    name: "The Cotton Company Dinner Napkins (set of 2)",
    description:
      "Larger dinner napkins from The Cotton Company. Add sophistication to your dining table.",
    points: 250,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Table Setting",
  },
];

export default function RedeemPage() {
  const { status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedReward, setSelectedReward] = useState<number | null>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/data");
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (status === "authenticated") {
      fetchUserData();
    } else if (status === "unauthenticated") {
      setLoadingData(false);
    }
  }, [status]);

  if (status === "loading" || loadingData) {
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

  const userPoints = userData?.points || 0;

  const handleSelectReward = (rewardId: number, requiredPoints: number) => {
    if (userPoints >= requiredPoints) {
      setSelectedReward(rewardId);
      // Here you would typically call an API to process the redemption
      alert(
        `Reward selected! You would redeem this for ${requiredPoints} points.`
      );
    }
  };

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
              <span className="hidden sm:inline">BACK TO DASHBOARD</span>
              <span className="sm:hidden">BACK</span>
            </Button>
            <h1 className="text-lg md:text-xl font-heading">REDEEM POINTS</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl mb-2 font-heading">
            REDEEM YOUR POINTS
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Choose from our selection of rewards and redeem your earned points
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
            <div className="p-3 bg-white border border-black min-w-[160px] h-[60px] flex items-center justify-center">
              <p className="text-sm font-medium text-center">
                Your Points:{" "}
                <span className="text-primary font-bold text-lg">
                  {userPoints}
                </span>
              </p>
            </div>
            <button
              onClick={() => {
                window.open("https://shop.bloedlemoengin.com/", "_blank");
              }}
              className="p-3 bg-black text-white border border-black font-heading text-sm font-medium hover:bg-gray-800 transition-colors min-w-[160px] h-[60px] flex items-center justify-center cursor-pointer"
            >
              EARN MORE POINTS
            </button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="font-heading text-lg md:text-xl font-normal">
              AVAILABLE REWARDS
            </CardTitle>
            <CardDescription className="text-sm">
              Use your points to unlock exclusive rewards and experiences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rewards.map((reward) => {
                const canAfford = userPoints >= reward.points;
                const isSelected = selectedReward === reward.id;

                return (
                  <Card
                    key={reward.id}
                    className={`relative overflow-hidden transition-all duration-200 h-full flex flex-col ${
                      !canAfford
                        ? "opacity-80 cursor-not-allowed"
                        : "hover:shadow-lg cursor-pointer"
                    } ${isSelected ? "ring-2 ring-primary" : ""}`}
                  >
                    {/* Lock overlay for unaffordable rewards */}
                    {!canAfford && (
                      <div className="absolute inset-0 bg-background/40 z-10 flex items-center justify-center">
                        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-2 rounded-full">
                          <Lock className="size-5 text-muted-foreground" />
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm p-2 rounded text-center">
                          <p className="text-xs text-muted-foreground font-medium">
                            Need {reward.points - userPoints} more points
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Reward Image - Fixed height */}
                    <div className="h-48 relative bg-muted flex-shrink-0">
                      <Image
                        src={reward.image}
                        alt={reward.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Reward Details - Flex grow to fill remaining space */}
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <div className="flex flex-col h-full">
                        {/* Title - Fixed height area */}
                        <div className="mb-3">
                          <h3 className="font-heading text-sm font-normal leading-tight line-clamp-2 min-h-[2.5rem] flex items-start">
                            {reward.name.toUpperCase()}
                          </h3>
                        </div>

                        {/* Description - Fixed height area */}
                        <div className="mb-4 flex-grow">
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 min-h-[3rem]">
                            {reward.description}
                          </p>
                        </div>

                        {/* Points and Category - Fixed height */}
                        <div className="flex items-center justify-between mb-3 min-h-[1.5rem]">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-primary text-sm">
                              {reward.points} points
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded flex-shrink-0">
                            {reward.category}
                          </span>
                        </div>

                        {/* Button - Fixed height */}
                        <Button
                          onClick={() =>
                            handleSelectReward(reward.id, reward.points)
                          }
                          disabled={!canAfford}
                          size="sm"
                          className="w-full h-9"
                        >
                          {!canAfford ? (
                            <>
                              <Lock className="size-4 mr-2" />
                              LOCKED
                            </>
                          ) : isSelected ? (
                            "SELECTED"
                          ) : (
                            <>
                              <Gift className="size-4 mr-2" />
                              SELECT
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
