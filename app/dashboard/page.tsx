"use client";

import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Camera, LogOut } from "lucide-react";
import { createWorker } from "tesseract.js";
import Image from "next/image";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [points, setPoints] = useState(150); // Mock points, would come from database
  const [uploading, setUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setOcrResult("");

    try {
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();

      setOcrResult(text);

      // Enhanced receipt validation with specific search criteria
      const receiptInfo = analyzeReceipt(text);

      if (receiptInfo.isValid) {
        const pointsEarned = calculatePoints(receiptInfo);
        const newPoints = points + pointsEarned;
        setPoints(newPoints);

        let message = `🎉 Bloedlemoen Gin Purchase Verified!\n\n`;
        message += `Points Earned: ${pointsEarned}\n`;
        message += `Total Points: ${newPoints}\n\n`;

        message += `📍 Store: ${
          receiptInfo.storeName || "Store not identified"
        }\n`;
        message += `🍾 Total Bottles: ${receiptInfo.totalBottles}\n\n`;

        message += `Products Found:\n`;
        receiptInfo.bloedlemoenProducts.forEach((product, index) => {
          message += `${index + 1}. ${product.name} (Qty: ${
            product.quantity
          })\n`;
        });

        if (receiptInfo.total)
          message += `\n💰 Receipt Total: R${receiptInfo.total}`;
        if (receiptInfo.date) message += `\n📅 Date: ${receiptInfo.date}`;

        alert(message);
      } else {
        let errorMessage = "❌ Could not verify Bloedlemoen Gin purchase.\n\n";
        errorMessage += "Please ensure your receipt shows:\n";
        errorMessage += "✓ 'Bloedlemoen Gin' product name\n";
        errorMessage += "✓ Quantity/number of bottles\n";
        errorMessage += "✓ Clear store name\n\n";

        if (receiptInfo.bloedlemoenProducts.length === 0) {
          errorMessage +=
            "No Bloedlemoen Gin products detected in this receipt.";
        } else {
          errorMessage += `Found ${receiptInfo.bloedlemoenProducts.length} potential product(s) but couldn't verify them.`;
        }

        alert(errorMessage);
      }
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Error processing image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Enhanced receipt analysis function
  const analyzeReceipt = (text: string) => {
    const lowerText = text.toLowerCase();
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const receiptInfo = {
      isValid: false,
      storeName: null as string | null,
      bloedlemoenProducts: [] as {
        name: string;
        quantity: number;
        line: string;
      }[],
      totalBottles: 0,
      total: null as string | null,
      date: null as string | null,
      confidence: 0,
    };

    // 1. Search for store names (add more as needed)
    const validStores = [
      "makro",
      "shoprite",
      "checkers",
      "pick n pay",
      "woolworths",
      "spar",
      "liquor city",
      "tops",
      "ultra liquors",
      "norman goodfellows",
      "wine route",
      "clicks",
      "dischem",
      "game",
      "builders warehouse",
      "bottle store",
      "liquor store",
      "wine shop",
      "spirit store",
    ];

    for (const store of validStores) {
      if (lowerText.includes(store)) {
        receiptInfo.storeName = store.toUpperCase();
        receiptInfo.confidence += 25;
        break;
      }
    }

    // 2. Search for Bloedlemoen Gin variations and count bottles
    const bloedlemoenPatterns = [
      /bloedlemoen\s*gin/i,
      /bloedlemoen\s*750ml/i,
      /bloedlemoen\s*bottle/i,
      /bloedlemoen/i,
    ];

    for (const line of lines) {
      // Check if line contains Bloedlemoen
      for (const pattern of bloedlemoenPatterns) {
        if (pattern.test(line)) {
          // Extract quantity from the line
          const quantity = extractQuantity(line);

          const product = {
            name: line.trim(),
            quantity: quantity,
            line: line,
          };

          receiptInfo.bloedlemoenProducts.push(product);
          receiptInfo.totalBottles += quantity;

          // Higher confidence for direct "bloedlemoen gin" match
          if (/bloedlemoen\s*gin/i.test(line)) {
            receiptInfo.confidence += 50;
          } else {
            receiptInfo.confidence += 30;
          }

          break; // Only match once per line
        }
      }
    }

    // 3. Search for total amount
    const totalPatterns = [
      /total[:\s]+r?[\s]*(\d+[.,]\d{2})/i,
      /amount[:\s]+r?[\s]*(\d+[.,]\d{2})/i,
      /^r[\s]*(\d+[.,]\d{2})$/i,
      /(\d+[.,]\d{2})[*\s]*total/i,
    ];

    for (const line of lines) {
      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          receiptInfo.total = match[1] || match[0];
          receiptInfo.confidence += 15;
          break;
        }
      }
      if (receiptInfo.total) break;
    }

    // 4. Search for date
    const datePatterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
      /(\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{2,4})/i,
      /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          receiptInfo.date = match[1];
          receiptInfo.confidence += 10;
          break;
        }
      }
      if (receiptInfo.date) break;
    }

    // 5. Determine if receipt is valid
    receiptInfo.isValid =
      receiptInfo.confidence >= 40 &&
      receiptInfo.bloedlemoenProducts.length > 0 &&
      receiptInfo.totalBottles > 0;

    return receiptInfo;
  };

  // Extract quantity from receipt line
  const extractQuantity = (line: string): number => {
    // Look for quantity patterns at the beginning or in the line
    const quantityPatterns = [
      /^(\d+)\s*x\s/i, // "2 x Bloedlemoen"
      /^(\d+)\s+/, // "2 Bloedlemoen"
      /\s(\d+)\s*x\s/i, // "Item 3 x Bloedlemoen"
      /qty[:\s]*(\d+)/i, // "Qty: 2"
      /quantity[:\s]*(\d+)/i, // "Quantity: 2"
      /(\d+)\s*bottle/i, // "2 bottles"
      /(\d+)\s*unit/i, // "2 units"
    ];

    for (const pattern of quantityPatterns) {
      const match = line.match(pattern);
      if (match) {
        const qty = parseInt(match[1], 10);
        return qty > 0 ? qty : 1;
      }
    }

    // If no explicit quantity found, assume 1
    return 1;
  };

  // Calculate points based on what was found
  const calculatePoints = (receiptInfo: {
    storeName: string | null;
    bloedlemoenProducts: { name: string; quantity: number; line: string }[];
    totalBottles: number;
    total: string | null;
    date: string | null;
    confidence: number;
  }) => {
    let points = 0;

    // Base points for valid Bloedlemoen purchase
    points += 30;

    // Points per bottle (to encourage bulk purchases)
    points += receiptInfo.totalBottles * 20;

    // Bonus for recognized store
    if (receiptInfo.storeName) points += 20;

    // Bonus for high-confidence detection
    if (receiptInfo.confidence >= 80) points += 25;

    // Bonus for complete information
    if (receiptInfo.storeName && receiptInfo.total && receiptInfo.date) {
      points += 15;
    }

    return Math.min(points, 150); // Cap at 150 points per receipt
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-xs md:text-sm text-muted-foreground truncate">
                Welcome, {session?.user?.name || session?.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">LOGOUT</span>
                <span className="sm:hidden">OUT</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-2 md:py-3">
        {/* Logo */}
        <div className="flex justify-center mb-2 md:mb-3">
          <Image
            src="/Bloedlemoen-Gin-Logo.jpg"
            alt="Bloedlemoen Logo"
            width={300}
            height={150}
            className="object-contain md:w-[400px] md:h-[200px]"
          />
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Points Card */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 font-heading text-lg md:text-xl font-normal">
                YOUR POINTS
              </CardTitle>
              <CardDescription className="text-sm">
                Accumulate points by uploading valid receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {points}
                </div>
                <p className="text-muted-foreground text-sm md:text-base">
                  Total Points Earned
                </p>
              </div>
              <div className="mt-4 md:mt-6 space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span>Progress to next reward</span>
                  <span>{points}/200</span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((points / 200) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 font-heading text-lg md:text-xl font-normal">
                <Camera className="size-4 md:size-5" />
                UPLOAD RECEIPT
              </CardTitle>
              <CardDescription className="text-sm">
                Upload a clear image of your receipt to earn points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="receipt" className="text-sm">
                  Receipt Image
                </Label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="cursor-pointer text-sm"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Upload className="size-4 mr-2" />
                    BROWSE
                  </Button>
                </div>
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Processing image with OCR...
                </div>
              )}

              {ocrResult && (
                <div className="space-y-2">
                  <Label className="text-sm">OCR Result:</Label>
                  <div className="bg-muted p-3 rounded-md text-xs md:text-sm max-h-32 overflow-y-auto">
                    {ocrResult}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-6 md:mt-8">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Button
              size="lg"
              className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 w-full sm:w-auto min-w-[160px] h-[60px]"
              onClick={() => router.push("/redeem")}
            >
              REDEEM POINTS
            </Button>
            <button
              onClick={() => {
                window.open("https://shop.bloedlemoengin.com/", "_blank");
              }}
              className="bg-white text-black border border-black font-heading text-base md:text-lg font-medium hover:bg-gray-50 transition-colors px-6 md:px-8 py-4 md:py-6 w-full sm:w-auto min-w-[160px] h-[60px] flex items-center justify-center cursor-pointer"
            >
              SHOP NOW
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="font-heading text-lg md:text-xl font-normal">
              RECENT ACTIVITY
            </CardTitle>
            <CardDescription className="text-sm">
              Your latest point earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm md:text-base">
                    Receipt uploaded
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Today, 2:30 PM
                  </p>
                </div>
                <div className="text-green-600 font-medium text-sm md:text-base">
                  +50 points
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm md:text-base">
                    Welcome bonus
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Yesterday, 10:15 AM
                  </p>
                </div>
                <div className="text-green-600 font-medium text-sm md:text-base">
                  +100 points
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
