"use client";

import { useState, useRef, useEffect } from "react";
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

interface UserData {
  id: string;
  name: string | null;
  email: string;
  points: number;
  totalEarned: number;
  memberSince: string;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  points: number;
  items: string[];
  verified: boolean;
  date: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/data");
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          setRecentActivity(data.recentActivity);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  // Function to save receipt data to database
  const saveReceiptToDatabase = async (receiptData: {
    ocrText: string;
    storeName: string | null;
    totalAmount: string | null;
    detectedItems: string[];
    pointsEarned: number;
  }) => {
    try {
      const response = await fetch("/api/receipts/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptData),
      });

      if (response.ok) {
        const result = await response.json();
        // Update user points and refresh activity
        setUserData((prev) =>
          prev ? { ...prev, points: result.newPointsBalance } : null
        );

        // Refresh recent activity
        const userResponse = await fetch("/api/user/data");
        if (userResponse.ok) {
          const data = await userResponse.json();
          setRecentActivity(data.recentActivity);
        }

        return result;
      }
    } catch (error) {
      console.error("Error saving receipt:", error);
    }
    return null;
  };

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

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      let extractedText = "";

      if (file.type === "application/pdf") {
        // Handle PDF files
        const arrayBuffer = await file.arrayBuffer();
        const response = await fetch("/api/receipts/extract-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pdfData: Array.from(new Uint8Array(arrayBuffer)),
            fileName: file.name,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          extractedText = result.text;
        } else {
          const errorData = await response.json();
          console.error("PDF extraction failed:", errorData);
          throw new Error(
            `PDF extraction failed: ${errorData.error || "Unknown error"}`
          );
        }
      } else {
        // Handle image files with OCR
        const worker = await createWorker("eng");
        const {
          data: { text },
        } = await worker.recognize(file);
        await worker.terminate();
        extractedText = text;
      }

      // Enhanced receipt validation with specific search criteria
      const receiptInfo = analyzeReceipt(extractedText);

      if (receiptInfo.isValid) {
        const pointsEarned = calculatePoints(receiptInfo);

        // Save to database
        const dbResult = await saveReceiptToDatabase({
          ocrText: extractedText,
          storeName: receiptInfo.storeName,
          totalAmount: receiptInfo.total,
          detectedItems: receiptInfo.bloedlemoenProducts.map((p) => p.name),
          pointsEarned: pointsEarned,
        });

        if (dbResult) {
          // Clean, simple success message showing only what user needs
          let message = `🎉 Success! Purchase Verified\n\n`;

          if (receiptInfo.totalBottles > 0) {
            message += `🍾 Bloedlemoen Bottles: ${receiptInfo.totalBottles}\n`;
          }

          if (receiptInfo.totalFeverTreePacks > 0) {
            message += `🥤 Fever Tree Packs: ${receiptInfo.totalFeverTreePacks}\n`;
          }

          message += `⭐ Points Earned: ${pointsEarned}\n`;
          message += `💰 Your Total Points: ${dbResult.newPointsBalance}`;

          alert(message);
        } else {
          alert("❌ Receipt could not be saved to database. Please try again.");
        }
      } else {
        let errorMessage = "❌ Could not verify qualifying products.\n\n";
        errorMessage += "Please ensure your receipt shows:\n";
        errorMessage += "✓ 'Bloedlemoen Gin' (100 points per bottle)\n";
        errorMessage +=
          "✓ 'Fever Tree Tonic' 4-pack or 8-pack (50 points each)\n";
        errorMessage += "✓ Clear store name\n\n";

        if (receiptInfo.bloedlemoenProducts.length === 0) {
          errorMessage += "No qualifying products detected in this receipt.";
        } else {
          errorMessage += `Found ${receiptInfo.bloedlemoenProducts.length} potential product(s) but couldn't verify them.`;
        }

        alert(errorMessage);
      }
    } catch (error) {
      console.error("OCR Error:", error);
      alert(
        "Error processing file. Please try again with a clear image or PDF."
      );
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

    // Debug logging
    console.log("=== RECEIPT ANALYSIS DEBUG ===");
    console.log("Full text length:", text.length);
    console.log("Number of lines:", lines.length);
    console.log("First 5 lines:", lines.slice(0, 5));
    console.log("Lines containing 'fever':", lines.filter(line => line.toLowerCase().includes('fever')));
    console.log("Lines containing 'tonic':", lines.filter(line => line.toLowerCase().includes('tonic')));
    console.log("Lines containing 'pack':", lines.filter(line => line.toLowerCase().includes('pack')));
    console.log("Lines containing 'free':", lines.filter(line => line.toLowerCase().includes('free')));
    console.log("Lines containing '+':", lines.filter(line => line.includes('+')));
    console.log("===============================");

    const receiptInfo = {
      isValid: false,
      storeName: null as string | null,
      bloedlemoenProducts: [] as {
        name: string;
        quantity: number;
        line: string;
        type: "bloedlemoen" | "fever-tree";
        points: number;
      }[],
      totalBottles: 0,
      totalFeverTreePacks: 0,
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

    // 2. Search for Bloedlemoen Gin variations and Fever Tree Tonic
    const bloedlemoenPatterns = [
      /bloedlemoen\s*gin/i,
      /bloedlemoen\s*750ml/i,
      /bloedlemoen\s*bottle/i,
      /bloedlemoen\s*premium/i,
      /bloedlemoen\s*blood\s*orange/i,
      /bloedlemoen/i,
    ];

    const feverTreePatterns = [
      // Original patterns
      /fever\s*tree\s*tonic/i,
      /fever\s*tree/i,
      /fvt\s*tonic/i,
      /fvt\s*200/i,
      /fvt\s*150\s*ml/i,
      /fvt\s*can/i,
      /fvt/i,
      /fever.*tree/i,
      /tonic.*fever/i,
      // Enhanced patterns for bundle descriptions
      /free\s*fever\s*tree/i,
      /fever\s*tree\s*tonic\s*water/i,
      /tonic\s*water.*fever/i,
      /tonic\s*water.*pack/i,
      /fever.*tonic.*water/i,
      /fever.*tree.*water/i,
      // Pattern for when it's mentioned as part of a bundle
      /\+.*fever.*tree/i,
      /\+.*tonic.*water/i,
      /complimentary.*fever/i,
      /complimentary.*tonic/i,
      // Even more specific patterns for the exact case
      /tonic\s*water/i, // Generic tonic water when in context
      /fever.*tree.*tonic.*water.*pack/i,
      /free.*tonic/i,
      /bonus.*tonic/i,
      /included.*tonic/i,
      /with.*tonic/i,
      // Pattern specifically for "Pack of X" format
      /fever.*tree.*pack\s*of/i,
      /tonic.*pack\s*of/i,
    ];

    // Track lines we've already processed to avoid duplicates
    const processedLines = new Set();

    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine.length < 3) continue;

      let hasBloedlemoen = false;
      let hasFeverTree = false;

      // Check for Bloedlemoen products
      for (const pattern of bloedlemoenPatterns) {
        if (pattern.test(cleanLine)) {
          console.log(`🍾 BLOEDLEMOEN FOUND: "${cleanLine}" matched pattern: ${pattern}`);
          const quantity = extractQuantity(cleanLine);
          console.log(`   Quantity: ${quantity}`);

          const product = {
            name: cleanLine,
            quantity: quantity,
            line: cleanLine,
            type: "bloedlemoen" as const,
            points: 100 * quantity, // 100 points per bottle
          };

          receiptInfo.bloedlemoenProducts.push(product);
          receiptInfo.totalBottles += quantity;
          hasBloedlemoen = true;

          // Higher confidence for direct "bloedlemoen gin" match
          if (/bloedlemoen\s*gin/i.test(cleanLine)) {
            receiptInfo.confidence += 50;
          } else if (/bloedlemoen\s*(750ml|bottle|premium)/i.test(cleanLine)) {
            receiptInfo.confidence += 40;
          } else {
            receiptInfo.confidence += 30;
          }

          break; // Only match once per line for Bloedlemoen
        }
      }

      // Check for Fever Tree Tonic products (can be in the same line as Bloedlemoen)
      for (const pattern of feverTreePatterns) {
        if (pattern.test(cleanLine)) {
          console.log(`🥤 FEVER TREE FOUND: "${cleanLine}" matched pattern: ${pattern}`);
          const quantity = extractFeverTreeQuantity(cleanLine);
          const packType = detectFeverTreePackType(cleanLine);
          console.log(`   Quantity: ${quantity}, Pack type: ${packType}`);

          const product = {
            name: cleanLine,
            quantity: quantity,
            line: cleanLine,
            type: "fever-tree" as const,
            points: 50 * quantity, // 50 points per pack (4-pack or 8-pack)
          };

          receiptInfo.bloedlemoenProducts.push(product);
          receiptInfo.totalFeverTreePacks += quantity;
          hasFeverTree = true;

          // Confidence based on pack type detection
          if (packType === "4-pack" || packType === "8-pack") {
            receiptInfo.confidence += 40;
          } else {
            receiptInfo.confidence += 25;
          }

          break; // Only match once per line for Fever Tree
        }
      }

      // Mark line as processed only if we found something to avoid duplicate processing
      if (hasBloedlemoen || hasFeverTree) {
        processedLines.add(cleanLine);
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
      (receiptInfo.totalBottles > 0 || receiptInfo.totalFeverTreePacks > 0);

    // Final debug summary
    console.log("=== FINAL ANALYSIS RESULTS ===");
    console.log("Total Bloedlemoen bottles:", receiptInfo.totalBottles);
    console.log("Total Fever Tree packs:", receiptInfo.totalFeverTreePacks);
    console.log("Total products found:", receiptInfo.bloedlemoenProducts.length);
    console.log("Confidence score:", receiptInfo.confidence);
    console.log("Is valid:", receiptInfo.isValid);
    console.log("Products detected:", receiptInfo.bloedlemoenProducts.map(p => `${p.type}: ${p.name} (${p.quantity}x, ${p.points} pts)`));
    console.log("===============================");

    return receiptInfo;
  };

  // Extract quantity for Fever Tree products
  const extractFeverTreeQuantity = (line: string): number => {
    const feverTreeQuantityPatterns = [
      /^(\d+)\s*x\s/i, // "2 x FVT"
      /^(\d+)\s+/i, // "2 FVT" at start
      /(\d+)\s*pack/i, // "4 pack"
      /pack\s*of\s*(\d+)/i, // "Pack of 4" - NEW PATTERN
      /(\d+)\s*@/i, // "1 @ R50"
      /(\d+)\s*\*/i, // "1 * R50"
      /qty[:\s]*(\d+)/i, // "Qty: 1"
      /\(pack\s*of\s*(\d+)\)/i, // "(Pack of 4)" - NEW PATTERN
      /\(\s*(\d+)\s*\)/i, // "(4)" when referring to pack size
    ];

    for (const pattern of feverTreeQuantityPatterns) {
      const match = line.match(pattern);
      if (match) {
        const qty = parseInt(match[1], 10);
        if (qty > 0 && qty <= 10) {
          // Reasonable limit for packs
          return qty;
        }
      }
    }

    return 1; // Default to 1 pack
  };

  // Detect Fever Tree pack type
  const detectFeverTreePackType = (
    line: string
  ): "4-pack" | "8-pack" | "unknown" => {
    const lowerLine = line.toLowerCase();

    // Check for explicit pack size mentions
    if (lowerLine.includes("pack of 4") || (lowerLine.includes("4") && lowerLine.includes("pack"))) {
      return "4-pack";
    }
    if (lowerLine.includes("pack of 8") || (lowerLine.includes("8") && lowerLine.includes("pack"))) {
      return "8-pack";
    }
    
    // Check for bottle/can size indicators
    if (
      lowerLine.includes("200") &&
      (lowerLine.includes("ml") || lowerLine.includes("fvt"))
    ) {
      return "4-pack"; // 200ml bottles usually come in 4-packs
    }
    if (
      lowerLine.includes("150") &&
      (lowerLine.includes("ml") || lowerLine.includes("can"))
    ) {
      return "8-pack"; // 150ml cans usually come in 8-packs
    }

    // Check for patterns with parentheses
    if (lowerLine.includes("(4)") || lowerLine.includes("( 4 )")) {
      return "4-pack";
    }
    if (lowerLine.includes("(8)") || lowerLine.includes("( 8 )")) {
      return "8-pack";
    }

    return "unknown";
  };

  // Extract quantity from receipt line with improved patterns
  const extractQuantity = (line: string): number => {
    // Look for quantity patterns - improved to catch more variations
    const quantityPatterns = [
      /^(\d+)\s*x\s/i, // "2 x Bloedlemoen"
      /^(\d+)\s+/i, // "2 Bloedlemoen" at start of line
      /\s(\d+)\s*x\s/i, // "Item 3 x Bloedlemoen"
      /qty[:\s]*(\d+)/i, // "Qty: 2"
      /quantity[:\s]*(\d+)/i, // "Quantity: 2"
      /(\d+)\s*bottle/i, // "2 bottles"
      /(\d+)\s*unit/i, // "2 units"
      /(\d+)\s*each/i, // "2 each"
      /(\d+)\s*pc/i, // "2 pc"
      /(\d+)\s*pcs/i, // "2 pcs"
      // New patterns for common receipt formats
      /(\d+)\s*@\s*r?\d+/i, // "2 @ R150" (quantity @ price)
      /(\d+)\s*\*\s*r?\d+/i, // "2 * R150" (quantity * price)
      /(\d+)\s+bloedlemoen/i, // "2 bloedlemoen"
      /bloedlemoen\s+(\d+)/i, // "bloedlemoen 2"
      // Look for multiple items pattern
      /(\d+)\s*(750ml|gin|bottle)/i, // "2 750ml" or "2 gin"
      // FVT specific patterns
      /(\d+)\s*(pack|fvt|fever)/i, // "4 pack FVT" or "1 fever"
      /fvt\s*(\d+)/i, // "FVT 4"
    ];

    for (const pattern of quantityPatterns) {
      const match = line.match(pattern);
      if (match) {
        const qty = parseInt(match[1], 10);
        if (qty > 0 && qty <= 20) {
          // Reasonable quantity limit
          return qty;
        }
      }
    }

    // Additional check: if line contains multiple mentions of bloedlemoen
    const bloedlemoenMatches = (line.toLowerCase().match(/bloedlemoen/g) || [])
      .length;
    if (bloedlemoenMatches > 1) {
      return bloedlemoenMatches;
    }

    // Check for price patterns that might indicate multiple items
    const priceMatches = line.match(/r?\d+[.,]\d{2}/gi);
    if (priceMatches && priceMatches.length > 1) {
      // If we see multiple prices, might be quantity indication
      const firstPrice = parseFloat(priceMatches[0].replace(/[r,]/gi, ""));
      const secondPrice = parseFloat(priceMatches[1].replace(/[r,]/gi, ""));

      // If one price is a clean multiple of the other, that might be quantity
      if (secondPrice > firstPrice && secondPrice % firstPrice === 0) {
        return Math.round(secondPrice / firstPrice);
      }
    }

    // If no explicit quantity found, assume 1
    return 1;
  };

  // Calculate points based on what was found
  const calculatePoints = (receiptInfo: {
    storeName: string | null;
    bloedlemoenProducts: {
      name: string;
      quantity: number;
      line: string;
      type: "bloedlemoen" | "fever-tree";
      points: number;
    }[];
    totalBottles: number;
    totalFeverTreePacks: number;
    total: string | null;
    date: string | null;
    confidence: number;
  }) => {
    let points = 0;

    // Calculate points from individual products
    receiptInfo.bloedlemoenProducts.forEach((product) => {
      points += product.points;
    });

    // Bonus for recognized store
    if (receiptInfo.storeName) points += 10;

    // Bonus for high-confidence detection
    if (receiptInfo.confidence >= 80) points += 15;

    // Bonus for complete information
    if (receiptInfo.storeName && receiptInfo.total && receiptInfo.date) {
      points += 10;
    }

    return points; // No cap - let points accumulate based on products
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
                  {userData?.points || 0}
                </div>
                <p className="text-muted-foreground text-sm md:text-base">
                  Total Points Earned
                </p>
              </div>
              <div className="mt-4 md:mt-6 space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span>Progress to next reward</span>
                  <span>{userData?.points || 0}/200</span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        ((userData?.points || 0) / 200) * 100,
                        100
                      )}%`,
                    }}
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
                Upload receipts for Bloedlemoen Gin (100 pts/bottle) or Fever
                Tree Tonic packs (50 pts/pack)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="receipt" className="text-sm">
                  Receipt Image or PDF
                </Label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,.pdf"
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
                  Processing receipt and detecting products...
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
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm md:text-base">
                        {activity.description}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {activity.items.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Items: {activity.items.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-green-600 font-medium text-sm md:text-base">
                      +{activity.points} points
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground p-6">
                  <p>No recent activity</p>
                  <p className="text-xs mt-1">
                    Upload your first receipt to get started!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
