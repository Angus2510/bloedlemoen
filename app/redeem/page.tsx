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
import { ScrollArea } from "@/components/ui/scroll-area";
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
      "Crafted to bring warmth and subtle dimension to your space. With gentle curves and a timeless silhouette, these holders fit effortlessly into any setting. Ideal for long lunches that turn into dinners, soft evenings or to simply enjoy the beauty of a well-placed flame. Whether holding a classic dinner candle or a soft tealight, each piece is made to adapt. Use them side by side or stack them for a bit of height to create a candlelit moment that feels considered and calm.",
    points: 100,
    image: "/candle-holder-2.jpeg", // Using logo as placeholder
    category: "Home Decor",
  },
  {
    id: 2,
    name: "Alkaline: Stackable Candle Holders (set of 4)",
    description:
      "Crafted to bring warmth and subtle dimension to your space. With gentle curves and a timeless silhouette, these holders fit effortlessly into any setting. Ideal for long lunches that turn into dinners, soft evenings or to simply enjoy the beauty of a well-placed flame. Whether holding a classic dinner candle or a soft tealight, each piece is made to adapt. Use them side by side or stack them for a bit of height to create a candlelit moment that feels considered and calm.",
    points: 200,
    image: "/candle-holder-4.jpeg", // Using logo as placeholder
    category: "Home Decor",
  },
  {
    id: 3,
    name: "Alkaline: Coasters (set of 4)",
    description:
      "Designed to complement the beauty of a classic Bloedlemoen G&T at golden hour. Each piece is thoughtfully cast in Jesmonite for a natural, stone-like feel, and finished with a subtle gloss to reflect just the right amount of light. Functional yet refined, these coasters are built to protect your surfaces with ease while adding a gentle pop of colour to your table. Whether you're gathering around the fire or setting the table for friends, they bring a calm, crafted elegance to every pour. Place your glass. Pause. Enjoy.",
    points: 250,
    image: "/coasters-2.jpeg", // Using logo as placeholder
    category: "Home Decor",
  },
  {
    id: 4,
    name: "Alkaline: Coasters (set of 2)",
    description:
      "Designed to complement the beauty of a classic Bloedlemoen G&T at golden hour. Each piece is thoughtfully cast in Jesmonite for a natural, stone-like feel, and finished with a subtle gloss to reflect just the right amount of light. Functional yet refined, these coasters are built to protect your surfaces with ease while adding a gentle pop of colour to your table. Whether you're gathering around the fire or setting the table for friends, they bring a calm, crafted elegance to every pour. Place your glass. Pause. Enjoy.",
    points: 150,
    image: "/coasters-4.jpeg", // Using logo as placeholder
    category: "Home Decor",
  },
  {
    id: 5,
    name: "Okra: Dinner Candles, 40 cm (set of 2)",
    description:
      "Designed to bring a warm, steady glow to your table as the light begins to fade. Whether it's sundowners on the patio or a long dinner that stretches long into the night, this classic set of dinner candles will set the tone with quiet elegance. Offering extended burn time for those special occasions.",
    points: 100,
    image: "/Okra-2.jpg", // Using logo as placeholder
    category: "Candles",
  },
  {
    id: 6,
    name: "Okra: Everyday Candles (set of 4)",
    description:
      "This practical candle offers long-lasting light. The kind that turns an ordinary evening into something golden. Pair its steady glow with the clink of ice, a splash of Bloedlemoen Gin and good company. Suddenly, time slows down, shadows dance and everything feels just right. Designed for life's quieter, finer moments.",
    points: 200,
    image: "/Okra-4.jpg", // Using logo as placeholder
    category: "Candles",
  },
  {
    id: 7,
    name: "Okra: GEAR LARGE",
    description:
      "With bold, gear inspired ridges and a clean tapered form, this large sculptural candle is made to be noticed and admired. It's more than just a source of light, it's an atmosphere setter, a conversation starter and the perfect companion to a well poured Bloedlemoen G&T. Designed for slow evenings and beautiful settings.",
    points: 150,
    image: "/Okra-1-gear.jpeg", // Using logo as placeholder
    category: "Home Accessories",
  },
  {
    id: 8,
    name: "Okra: Bead Candle Pent (set of 2)",
    description:
      "With its bold beaded form and warm, ambient glow, the Bead Pent Candle is designed to elevate your space. Sculptural and striking, it brings a sense of calm and quiet drama to any setting. Best enjoyed with a Bloedlemoen in hand and no real rush to be anywhere.",
    points: 150,
    image: "/Okra-bead-2.jpg", // Using logo as placeholder
    category: "Candles",
  },
  {
    id: 9,
    name: "Bodega Mini Tumblers (set of 4)",
    description:
      "This set of mini tumblers is the kind you reach for when the Bloedlemoen comes out. Clean lines and tough tempered glass make them a practical favourite. Unfussy, durable and ready for anything. From relaxed drinks on the patio to Bloedlemoen cocktails shared across a long table, these are the glasses that keep the good times going. Just add ice. A splash of Bloedlemoen. And whoever makes you laugh the loudest.",
    points: 250,
    image: "/tumblers.jpg", // Using logo as placeholder
    category: "Barware",
  },
  {
    id: 10,
    name: "Mia Melange Placemats (set of 2)",
    description:
      "For tables that tell stories. Beautifully handcrafted placemats designed to bring a touch of natural elegance to your table setting. Easygoing, unfussed and full of charm. Whether it's a midweek meal or a long lunch with friends, this is the kind of detail that draws people in without saying a word. Set the table. Pour the Bloedlemoen. Stay a while.",
    points: 300,
    image: "/place-mats.jpeg", // Using logo as placeholder
    category: "Table Setting",
  },
  {
    id: 11,
    name: "The Cotton Company Cocktail Napkins (set of 2)",
    description:
      "Designed to do more than catch a drip, they complete the moment. Neatly placed under a freshly mixed Bloedlemoen cocktail, adding layers of texture, colour and glam. Woven with care and styled to suit both casual gatherings and more refined affairs, these napkins bring a gentle elegance to every glass.",
    points: 200,
    image: "/dinner-napkin-2.jpeg", // Using logo as placeholder
    category: "Table Setting",
  },
  {
    id: 12,
    name: "The Cotton Company Dinner Napkins (set of 2)",
    description:
      "These traditionally woven dinner napkins bring a relaxed, effortless and refined feel to any gathering. Whether it's a slow afternoon lunch or an evening of shared plates with a Bloedlemoen cocktail in hand, it'll add just the right touch of texture and charm.",
    points: 250,
    image: "/cocktail-napkin.jpeg", // Using logo as placeholder
    category: "Table Setting",
  },
];

export default function RedeemPage() {
  const { status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedRewards, setSelectedRewards] = useState<{
    [key: number]: number;
  }>({}); // reward id -> quantity

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

  const handleQuantityChange = (rewardId: number, change: number) => {
    setSelectedRewards((prev) => {
      const currentQty = prev[rewardId] || 0;
      const newQty = Math.max(0, currentQty + change);

      // Calculate what the total would be with this change
      const tempSelected = { ...prev };
      if (newQty === 0) {
        delete tempSelected[rewardId];
      } else {
        tempSelected[rewardId] = newQty;
      }

      // Calculate total points with the proposed change
      const proposedTotal = Object.entries(tempSelected).reduce(
        (total, [id, quantity]) => {
          const reward = rewards.find((r) => r.id === parseInt(id));
          return total + (reward ? reward.points * quantity : 0);
        },
        0
      );

      // Only allow the change if user has enough points
      if (proposedTotal > userPoints) {
        alert(
          `Cannot add more items. You would need ${proposedTotal} points but only have ${userPoints} points.`
        );
        return prev; // Return unchanged state
      }

      if (newQty === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [rewardId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [rewardId]: newQty };
    });
  };

  const getTotalSelectedPoints = () => {
    return Object.entries(selectedRewards).reduce(
      (total, [rewardId, quantity]) => {
        const reward = rewards.find((r) => r.id === parseInt(rewardId));
        return total + (reward ? reward.points * quantity : 0);
      },
      0
    );
  };

  const getSelectedItemsForCheckout = () => {
    return Object.entries(selectedRewards).map(([rewardId, quantity]) => {
      const reward = rewards.find((r) => r.id === parseInt(rewardId))!;
      return {
        id: reward.id,
        name: reward.name,
        points: reward.points,
        quantity: quantity,
        category: reward.category,
      };
    });
  };

  const handleCheckout = () => {
    const selectedItems = getSelectedItemsForCheckout();
    const totalPoints = getTotalSelectedPoints();

    if (selectedItems.length === 0) {
      alert("Please select at least one reward to checkout.");
      return;
    }

    if (totalPoints > userPoints) {
      alert(
        `You need ${totalPoints} points but only have ${userPoints} points.`
      );
      return;
    }

    // Navigate to checkout with selected items
    const itemsParam = encodeURIComponent(JSON.stringify(selectedItems));
    router.push(`/checkout?items=${itemsParam}`);
  };

  const totalSelectedPoints = getTotalSelectedPoints();
  const selectedItemsCount = Object.values(selectedRewards).reduce(
    (sum, qty) => sum + qty,
    0
  );

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
            {totalSelectedPoints > 0 && (
              <div className="p-3 bg-primary text-primary-foreground border border-primary min-w-[160px] h-[60px] flex items-center justify-center">
                <p className="text-sm font-medium text-center">
                  Cart Total:{" "}
                  <span className="font-bold text-lg">
                    {totalSelectedPoints}
                  </span>
                </p>
              </div>
            )}
            <button
              onClick={() => {
                window.open("https://shop.bloedlemoengin.com/", "_blank");
              }}
              className="p-3 bg-black text-white border border-black font-heading text-sm font-medium hover:bg-gray-800 transition-colors min-w-[160px] h-[60px] flex items-center justify-center cursor-pointer"
            >
              EARN MORE POINTS
            </button>
          </div>

          {/* Point usage indicator */}
          {totalSelectedPoints > 0 && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="flex justify-between text-sm mb-2">
                <span>Points Used</span>
                <span>
                  {totalSelectedPoints} / {userPoints}
                </span>
              </div>
              <div className="bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    totalSelectedPoints > userPoints
                      ? "bg-red-500"
                      : "bg-primary"
                  }`}
                  style={{
                    width: `${Math.min(
                      (totalSelectedPoints / userPoints) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              {totalSelectedPoints > userPoints && (
                <p className="text-red-600 text-xs mt-1 font-medium">
                  ⚠️ Exceeds available points by{" "}
                  {totalSelectedPoints - userPoints}
                </p>
              )}
            </div>
          )}
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
                const currentQuantity = selectedRewards[reward.id] || 0;
                const isSelected = currentQuantity > 0;
                const totalSelectedPoints = getTotalSelectedPoints();
                const remainingPoints = userPoints - totalSelectedPoints;
                const canAddMore = remainingPoints >= reward.points;

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
                      <div className="absolute inset-0 bg-background/40 z-10 flex items-center justify-center pointer-events-none">
                        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-2 rounded-full">
                          <Lock className="size-5 text-muted-foreground" />
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm p-2 rounded text-center">
                          <p className="text-xs text-muted-foreground font-medium">
                            Need {Math.ceil((reward.points - userPoints) / 100)}{" "}
                            more bottle
                            {Math.ceil((reward.points - userPoints) / 100) !== 1
                              ? "s"
                              : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Reward Image - Square aspect ratio */}
                    <div className="aspect-square relative bg-muted flex-shrink-0">
                      <Image
                        src={reward.image}
                        alt={reward.name}
                        fill
                        className="object-contain"
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
                          <ScrollArea className="h-[4.5rem]">
                            <p className="text-xs text-muted-foreground leading-relaxed pr-3">
                              {reward.description}
                            </p>
                          </ScrollArea>
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

                        {/* Point availability warning */}
                        {canAfford && isSelected && !canAddMore && (
                          <div className="mb-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                            Only {Math.floor(remainingPoints / reward.points)}{" "}
                            more can be added
                          </div>
                        )}

                        {/* Quantity Controls or Add Button */}
                        {canAfford && isSelected ? (
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleQuantityChange(reward.id, -1)
                              }
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="mx-3 font-medium">
                              Qty: {currentQuantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(reward.id, 1)}
                              className="h-8 w-8 p-0"
                              disabled={!canAddMore}
                              title={
                                !canAddMore
                                  ? "Not enough points remaining"
                                  : "Add one more"
                              }
                            >
                              +
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleQuantityChange(reward.id, 1)}
                            disabled={
                              !canAfford || (!isSelected && !canAddMore)
                            }
                            size="sm"
                            className="w-full h-9"
                            title={
                              !canAfford
                                ? "Not enough points"
                                : !canAddMore
                                ? "Not enough points remaining"
                                : "Add to cart"
                            }
                          >
                            {!canAfford ? (
                              <>
                                <Lock className="size-4 mr-2" />
                                LOCKED
                              </>
                            ) : !canAddMore ? (
                              <>
                                <Lock className="size-4 mr-2" />
                                INSUFFICIENT POINTS
                              </>
                            ) : (
                              <>
                                <Gift className="size-4 mr-2" />
                                ADD TO CART
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Checkout Section */}
            {selectedItemsCount > 0 && (
              <div className="mt-6 p-4 bg-card border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading text-lg">CART SUMMARY</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedItemsCount} item
                      {selectedItemsCount !== 1 ? "s" : ""} selected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      {totalSelectedPoints} points
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userPoints - totalSelectedPoints} points remaining
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full mt-4"
                  size="lg"
                  disabled={totalSelectedPoints > userPoints}
                >
                  PROCEED TO CHECKOUT
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
