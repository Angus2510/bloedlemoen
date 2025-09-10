"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

// Mock rewards data - in a real app this would come from an API
const rewards = [
  {
    id: 1,
    name: "Premium Gin Collection",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    points: 350,
    image: "/bloedlemoen-bottles.jpg",
    category: "Premium",
  },
  {
    id: 2,
    name: "Bloedlemoen Gin Bottle",
    description:
      "A premium 750ml bottle of Bloedlemoen Gin with botanical notes",
    points: 200,
    image: "/Landing-Page-Bottle.png",
    category: "Premium",
  },
  {
    id: 3,
    name: "Bloedlemoen T-Shirt",
    description:
      "Official branded t-shirt in premium cotton with embroidered logo",
    points: 100,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Apparel",
  },
  {
    id: 4,
    name: "Gin Tasting Experience",
    description:
      "Exclusive gin tasting session with our master distiller and premium cocktails",
    points: 300,
    image: "/Bloedlemoen-Gin-Serve-Gallery-1.jpg",
    category: "Experience",
  },
  {
    id: 5,
    name: "Cocktail Recipe Book",
    description:
      "Digital recipe book with 25 premium cocktail recipes and mixing techniques",
    points: 50,
    image: "/Landing-Page-Logo.png", // Using logo as placeholder
    category: "Digital",
  },
];

export default function RedeemPage() {
  const { status } = useSession();
  const router = useRouter();
  const [userPoints] = useState(150); // Mock user points - in real app would come from context/API
  const [selectedReward, setSelectedReward] = useState<number | null>(null);

  if (status === "loading") {
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
              onClick={() => router.push("/dashboard")}
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
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {rewards.map((reward) => {
                const canAfford = userPoints >= reward.points;
                const isSelected = selectedReward === reward.id;

                return (
                  <Card
                    key={reward.id}
                    className={`relative overflow-hidden transition-all duration-200 ${
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

                    {/* Reward Image */}
                    <div className="aspect-square relative bg-muted">
                      <Image
                        src={reward.image}
                        alt={reward.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Reward Details */}
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-heading text-sm md:text-base font-normal">
                            {reward.name.toUpperCase()}
                          </h3>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                            {reward.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-primary">
                              {reward.points} points
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {reward.category}
                          </span>
                        </div>

                        <Button
                          onClick={() =>
                            handleSelectReward(reward.id, reward.points)
                          }
                          disabled={!canAfford}
                          size="sm"
                          className="w-full"
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
