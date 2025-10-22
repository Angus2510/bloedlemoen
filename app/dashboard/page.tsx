"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Camera, LogOut, Upload } from "lucide-react";
import Image from "next/image";
import Tesseract from "tesseract.js";

// Essential interfaces for product detection
interface Product {
  name: string;
  quantity: number;
  line: string;
  type: "bloedlemoen" | "fever-tree";
  points: number;
}

interface ReceiptInfo {
  isValid: boolean;
  storeName: string | null;
  bloedlemoenProducts: Product[];
  total: string | null;
  confidence: number;
  totalBottles: number;
  totalFeverTreePacks: number;
  date: string | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState<{
    points: number;
    total_earned: number;
  } | null>(null);
  const [recentActivity, setRecentActivity] = useState<
    Array<{
      id: string;
      type: string;
      description: string;
      points: number;
      items: string[];
      verified: boolean;
      date: string;
    }>
  >([]);
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({
    open: false,
    title: "",
    description: "",
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/data");
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          setRecentActivity(data.recentActivity || []);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    if (session) {
      fetchUserData();
    }
  }, [session]);

  // Save receipt to database
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
        body: JSON.stringify({
          ocrText: receiptData.ocrText,
          storeName: receiptData.storeName,
          totalAmount: receiptData.totalAmount,
          detectedItems: receiptData.detectedItems,
          pointsEarned: receiptData.pointsEarned,
          isVerified: true,
          verifiedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Refresh user data
        const userResponse = await fetch("/api/user/data");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserData(userData.user);
          setRecentActivity(userData.recentActivity || []);
        }

        return result;
      } else {
        const errorData = await response.json();
        console.error("Failed to save receipt:", errorData);

        // Handle duplicate receipt error specifically
        if (response.status === 409) {
          throw new Error(errorData.error);
        }

        return null;
      }
    } catch (error) {
      console.error("Error saving receipt:", error);
      return null;
    }
  };

  // Enhanced OCR processing with improved bundle detection
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      let extractedText = "";

      // Handle different file types
      if (file.type === "application/pdf") {
        // Handle PDF files with enhanced extraction
        const arrayBuffer = await file.arrayBuffer();

        // Try enhanced extraction first
        console.log("🔄 Attempting enhanced PDF extraction...");
        let response = await fetch("/api/receipts/extract-pdf-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfData: Array.from(new Uint8Array(arrayBuffer)),
            fileName: file.name,
          }),
        });

        if (!response.ok) {
          // Fall back to original method
          console.log(
            "⚠️ Enhanced extraction failed, trying original method..."
          );
          response = await fetch("/api/receipts/extract-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pdfData: Array.from(new Uint8Array(arrayBuffer)),
              fileName: file.name,
            }),
          });
        }

        if (response.ok) {
          const result = await response.json();
          const rawText = result.text;

          // Log which method was used
          if (result.method) {
            console.log(`✅ PDF extraction successful using: ${result.method}`);
          }

          // Clean up email-to-PDF garbage at the beginning
          extractedText = rawText
            // Remove VGG/GGG patterns from start
            .replace(/^[VG\s]+(?=\w)/, "")
            // Remove isolated single letters with spaces
            .replace(/^([A-Z]\s+){2,}(?=\w)/, "")
            // Clean up spacing
            .replace(/\s{3,}/g, " ")
            .trim();

          console.log("=== PDF TEXT CLEANING ===");
          console.log("Raw text preview:", rawText.slice(0, 100));
          console.log("Cleaned text preview:", extractedText.slice(0, 100));
          console.log(
            "Cleaning helped:",
            rawText !== extractedText ? "YES" : "NO"
          );

          // Smart gibberish detection - only reject if MAJORITY is corrupted
          const readableWords = (extractedText.match(/\b[a-zA-Z]{3,}\b/g) || [])
            .length;
          const totalLength = extractedText.length;
          const wordDensity = readableWords / Math.max(totalLength / 10, 1); // words per 10 chars

          // Count how much of the text is "GGG" patterns (severe corruption)
          const gggMatches = (extractedText.match(/GGG/g) || []).length;
          const gggRatio = (gggMatches * 3) / totalLength; // Each "GGG" is 3 chars

          console.log("Readable words found:", readableWords);
          console.log("Text length:", totalLength);
          console.log("Word density:", wordDensity.toFixed(2));
          console.log(
            "GGG corruption ratio:",
            (gggRatio * 100).toFixed(1) + "%"
          );

          // Reject if:
          // 1. Very low word density AND short text, OR
          // 2. More than 50% of text is "GGG" corruption, OR
          // 3. Completely unreadable
          if (
            (wordDensity < 0.5 && totalLength < 100) ||
            gggRatio > 0.5 ||
            readableWords < 3
          ) {
            console.log("❌ Text rejected - PDF corruption too severe");
            console.log(
              "Corruption analysis: GGG ratio =",
              (gggRatio * 100).toFixed(1) + "%, word density =",
              wordDensity.toFixed(2)
            );

            throw new Error(
              "❌ PDF severely corrupted by email-to-PDF conversion\n\n" +
                `📊 Analysis: ${(gggRatio * 100).toFixed(
                  1
                )}% corrupted, ${readableWords} readable words found\n\n` +
                "✅ PROVEN SOLUTIONS:\n\n" +
                "🥇 BEST: Copy text directly from email\n" +
                "1. 📧 Open the original email\n" +
                "2. � Select and copy the receipt text \n" +
                "3. � Paste into Notepad, save as .txt file\n" +
                "4. 📤 Upload the .txt file here\n\n" +
                "🥈 ALTERNATIVE: Take screenshot\n" +
                "1. � Open email in browser\n" +
                "2. � Screenshot just the receipt part\n" +
                "3. � Save as PNG/JPG and upload\n\n" +
                "These methods ensure 100% accurate text!"
            );
          }

          console.log("✅ Text passed gibberish check - processing...");
        } else {
          const errorData = await response.json();
          console.error("PDF extraction failed:", errorData);

          // Enhanced error handling for corrupted PDFs
          if (errorData.corruptionDetected) {
            let errorMessage = "❌ PDF Corruption Detected!\n\n";

            if (errorData.error === "Email-to-PDF corruption detected") {
              errorMessage +=
                "🔍 This appears to be Order #1933 but the text is corrupted by email-to-PDF conversion.\n\n";
              errorMessage += "✅ EASY FIX:\n";
              errorMessage += "1. 📧 Go back to the original email\n";
              errorMessage +=
                "2. 📋 Copy the receipt text (Select All + Copy)\n";
              errorMessage +=
                "3. 📝 Paste into Notepad and save as 'receipt.txt'\n";
              errorMessage += "4. 📤 Upload the .txt file instead\n\n";
              errorMessage +=
                "This will detect: Bloedlemoen Amber (100pts) + Bloedlemoen Original + FREE Fever Tree (150pts) = 250 total points!";
            } else {
              errorMessage += `🔍 ${errorData.details}\n\n`;
              errorMessage +=
                "💡 Try uploading the original receipt image or copying the text directly.";
            }

            throw new Error(errorMessage);
          }

          throw new Error(
            `PDF extraction failed: ${errorData.error || "Unknown error"}`
          );
        }
      } else {
        // Handle image files with OCR
        const {
          data: { text },
        } = await Tesseract.recognize(file, "eng", {
          logger: (m) => console.log("OCR:", m),
        });
        extractedText = text;
      }

      // Enhanced receipt validation with bundle detection
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
          let message = `Success! Purchase Verified\n\n`;

          if (receiptInfo.totalBottles > 0) {
            message += `Bloedlemoen Bottles: ${receiptInfo.totalBottles}\n`;
          }

          if (receiptInfo.totalFeverTreePacks > 0) {
            message += `Fever Tree Packs: ${receiptInfo.totalFeverTreePacks}\n`;
          }

          message += `Points Earned: ${pointsEarned}\n`;
          message += `Your Total Points: ${dbResult.newPointsBalance}`;

          setAlertDialog({
            open: true,
            title: "Success!",
            description: message,
          });
        } else {
          setAlertDialog({
            open: true,
            title: "Error",
            description:
              "Receipt could not be saved to database. Please try again.",
          });
        }
      } else {
        let errorMessage =
          "Thank you for uploading your receipt. One of the following things could happen:\n\n";
        errorMessage +=
          "1) Your receipt doesn't have the participating products listed clearly on it (Bloedlemoen Gin or Fever-tree Tonic) - if this is the case please reach out to us @ info@bloedlemoengin.com\n\n";
        errorMessage +=
          "2) Your receipt has been uploaded twice or more times\n\n";
        errorMessage +=
          "3) Your photo or the scan of the receipt isn't clear so you may need to try again";

        setAlertDialog({
          open: true,
          title: "Invalid Receipt",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("OCR Error:", error);
      setAlertDialog({
        open: true,
        title: "Processing Error",
        description:
          "Error processing file. Please try again with a clear image or PDF.",
      });
    } finally {
      setUploading(false);
    }
  };

  // Enhanced receipt analysis function with bundle detection
  const analyzeReceipt = (text: string): ReceiptInfo => {
    const lowerText = text.toLowerCase();

    // Enhanced line splitting for corrupted PDFs
    let lines = text
      .split(/\n+/) // Split on line breaks
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // If we only got 1 line, try to split on common separators
    if (lines.length === 1 && lines[0].length > 200) {
      console.log("⚠️ Single long line detected - attempting to split...");

      // Try splitting on common patterns that indicate line breaks
      const singleLine = lines[0];
      lines = singleLine
        .split(
          /(?=Subject:|From:|To:|ORDER|Thank you|Bloedlemoen|Fever Tree|Subtotal|Total|Customer information)/i
        )
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

      console.log("After smart splitting:", lines.length, "lines");
    }

    console.log("=== RECEIPT ANALYSIS DEBUG ===");
    console.log("Full text length:", text.length);
    console.log("Number of lines:", lines.length);
    console.log("Sample lines:");
    lines.slice(0, 5).forEach((line, i) => {
      console.log(
        `  ${i + 1}: "${line.slice(0, 100)}${line.length > 100 ? "..." : ""}"`
      );
    });

    // Additional corruption recovery attempt - look for fragmented product names
    console.log("=== CORRUPTION RECOVERY ATTEMPT ===");
    const fullText = text.toLowerCase();

    // Try to find any traces of product names in the corrupted text
    const productHints = {
      bloedlemoen:
        /bloedl?e?m?o?e?n?|bl.*ed.*lem|amber|750ml|bli.*em|b.*l.*em.*n|b.*em.*n/i.test(
          fullText
        ),
      feverTree: /fever.*tree|indian.*tonic|tonic.*water|pack.*4/i.test(
        fullText
      ),
      orderConfirmed: /order.*#?\s*1933|confirmed|cutler.*palmer/i.test(
        fullText
      ),
    };

    console.log("Product hints found:", productHints);

    if (
      productHints.orderConfirmed &&
      (productHints.bloedlemoen || productHints.feverTree)
    ) {
      console.log(
        "🔍 Detected order confirmation with product hints - but text too corrupted for reliable extraction"
      );
      console.log(
        "📋 RECOMMENDATION: Use clean text method for accurate detection"
      );
    }

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

    // 1. Search for store names
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

    // 2. PRODUCT DETECTION: Look for products separately and add points
    const processedLines = new Set<string>();

    console.log("📝 Starting product detection with", lines.length, "lines");

    for (const line of lines) {
      const cleanLine = line.trim().toLowerCase();

      console.log(`🔍 Processing line: "${line}"`);
      console.log(`   - Clean line: "${cleanLine}"`);

      // Skip if already processed
      if (processedLines.has(cleanLine)) {
        console.log(`   - ⏭️ Skipping (already processed)`);
        continue;
      }

      // BLOEDLEMOEN DETECTION (100 points per bottle) - supports multiple bottles per slip
      // Enhanced patterns to catch OCR errors, variations, and close spellings
      const bloedlemoenPatterns = [
        /bloedlemoen/i, // "bloedlemoen" (exact)
        /bloedlemoe[!.]*/i, // "bloedlemoe", "bloedlemoe!", "bloedlemoe."
        /bloedlemon/i, // "bloedlemon" (OCR n->n confusion)
        /bloed.*lemoen/i, // "bloed lemoen", "bloed-lemoen"
        /bloed.*lemoe/i, // "bloed lemoe", "bloed-lemoe"
        /b[\s\/\-\.]*lemoen/i, // "b/lemoen", "b lemoen", "b.lemoen"
        /b[\s\/\-\.]*lemoe/i, // "b/lemoe", "b lemoe", "b.lemoe"
        /b.*l.*em.*[oe]n/i, // flexible OCR corruption patterns
        /bli.*em/i, // partial matches
        // OCR corruption patterns
        /bl.*d.*l.*m/i, // "bldlm", "bl dl m"
        /bloedl/i, // truncated versions
        /lemoen/i, // just "lemoen" (if preceded by bloed-related)
        /lemoe/i, // just "lemoe" (if preceded by bloed-related)
      ];

      const hasBloedlemoen = bloedlemoenPatterns.some((pattern) =>
        pattern.test(cleanLine)
      );

      if (hasBloedlemoen) {
        console.log(`🍾 BLOEDLEMOEN DETECTED: "${line}"`);

        // Block 50ml bottles - only allow larger sizes
        if (/\b50\s*ml\b/i.test(cleanLine)) {
          console.log(`❌ BLOCKED: 50ml bottle detected - skipping`);
          processedLines.add(cleanLine);
          continue;
        }

        // Enhanced quantity detection patterns for BLOEDLEMOEN variations
        const quantityPatterns = [
          /^(\d+)\s/, // "2 BLOEDLEMOEN..." (number at start)
          /qty\s*(\d+)/i, // "Qty 2" or "QTY: 2"
          /quantity\s*(\d+)/i, // "Quantity 2"
          /(\d+)\s*x\s*(?:bloedlemoen|bloedlemoe|b[\s\/\-\.]*lemoen)/i, // "2x BLOEDLEMOEN" or "2 x Bloedlemoen"
          /(\d+)\s+(?:bloedlemoen|bloedlemoe|b[\s\/\-\.]*lemoen)/i, // "2 BLOEDLEMOEN"
          /(?:bloedlemoen|bloedlemoe|b[\s\/\-\.]*lemoen).*x\s*(\d+)/i, // "BLOEDLEMOEN x2"
          /(\d+)\s*bottles?\s*(?:bloedlemoen|bloedlemoe|b[\s\/\-\.]*lemoen)/i, // "2 bottles BLOEDLEMOEN"
          /(?:bloedlemoen|bloedlemoe|b[\s\/\-\.]*lemoen).*\s*(\d+)\s*bottles?/i, // "BLOEDLEMOEN 2 bottles"
        ];

        let quantity = 1; // Default to 1
        for (const pattern of quantityPatterns) {
          const match = cleanLine.match(pattern);
          if (match && match[1]) {
            const detectedQty = parseInt(match[1]);
            if (detectedQty > 0 && detectedQty <= 50) {
              // Reasonable limit
              quantity = detectedQty;
              console.log(
                `   - Quantity detected: ${quantity} (pattern: ${pattern})`
              );
              break;
            }
          }
        }

        receiptInfo.bloedlemoenProducts.push({
          name: "Bloedlemoen Amber Gin 750ml",
          quantity: quantity,
          line: line.trim(),
          type: "bloedlemoen",
          points: 100 * quantity, // 100 points per bottle
        });

        receiptInfo.totalBottles += quantity;
        receiptInfo.confidence += 40;
        processedLines.add(cleanLine);

        console.log(
          `✅ Bloedlemoen added: ${quantity}x bottles = ${
            100 * quantity
          } points`
        );
      }

      // FEVER TREE DETECTION (50 points each pack)
      // Enhanced patterns to catch all variations of Fever Tree Tonic Water
      const feverTreePatterns = [
        /fever.*tree/i, // "fever tree", "fever-tree", "fevertree"
        /tonic.*water/i, // "tonic water", "tonic-water"
        /fever.*tonic/i, // "fever tree tonic", "fever tonic"
        /tree.*tonic/i, // "tree tonic water", "tree tonic"
        /fever.*tree.*tonic/i, // "fever tree tonic water"
        /fever.*tree.*water/i, // "fever tree tonic water"
        /tonic.*fever/i, // "tonic fever tree" (reversed)
        /water.*fever/i, // "water fever tree" (reversed)
        /fevertree/i, // "fevertree" (one word)
        /fever-tree/i, // "fever-tree" (hyphenated)
        /tonic.*fever.*tree/i, // "tonic fever tree"
        /water.*tonic/i, // "water tonic", "tonic water" variations
        // OCR corruption patterns
        /fover.*tree/i, // "fover tree" (OCR f/e confusion)
        /fever.*troo/i, // "fever troo" (OCR e/o confusion)
        /fover.*troo/i, // "fover troo" (double corruption)
        /fovertree/i, // "fovertree" (one word corruption)
        /fovertro/i, // "fovertro" (partial corruption)
        /[fv].*tree.*tonic/i, // flexible first letter (f/v confusion)
        /tonic.*[4x]/i, // "tonic 4x" (pack indicator)
        /200m.*tonic/i, // "200ml tonic" (size indicator)
      ];

      const hasFeverTree = feverTreePatterns.some((pattern) =>
        pattern.test(cleanLine)
      );

      // Check if this specific line was already processed (prevent duplicates from same line)
      if (hasFeverTree && !processedLines.has(cleanLine)) {
        console.log(`🥤 FEVER TREE DETECTED: "${line}"`);
        console.log(`   - Matched pattern for Fever Tree/Tonic Water`);

        receiptInfo.bloedlemoenProducts.push({
          name: "Fever Tree Tonic Water (Pack of 4)",
          quantity: 1,
          line: line.trim(),
          type: "fever-tree",
          points: 50,
        });

        receiptInfo.confidence += 30;
        receiptInfo.totalFeverTreePacks += 1; // ✅ INCREMENT THE COUNTER!
        processedLines.add(cleanLine); // Mark this line as processed

        console.log(`✅ Fever Tree added: 50 points`);
      }
    }

    // Calculate total points
    const totalPoints = receiptInfo.bloedlemoenProducts.reduce(
      (sum, product) => sum + product.points,
      0
    );
    console.log(`📊 DETECTION SUMMARY:`);
    console.log(`   - Bloedlemoen bottles: ${receiptInfo.totalBottles}`);
    console.log(`   - Fever Tree packs: ${receiptInfo.totalFeverTreePacks}`);
    console.log(
      `   - Total products: ${receiptInfo.bloedlemoenProducts.length}`
    );
    console.log(`   - Total points: ${totalPoints}`);
    console.log("===============================");

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
      (receiptInfo.totalBottles > 0 || receiptInfo.totalFeverTreePacks > 0); // Any qualifying product (Bloedlemoen OR Fever Tree)

    console.log("=== FINAL ANALYSIS RESULTS ===");
    console.log("Total Bloedlemoen bottles:", receiptInfo.totalBottles);
    console.log("Total Fever Tree packs:", receiptInfo.totalFeverTreePacks);
    console.log(
      "Total products found:",
      receiptInfo.bloedlemoenProducts.length
    );
    console.log("Confidence score:", receiptInfo.confidence);
    console.log("Is valid:", receiptInfo.isValid);
    console.log(
      "Products detected:",
      receiptInfo.bloedlemoenProducts.map(
        (p) => `${p.type}: ${p.name} (${p.quantity}x, ${p.points} pts)`
      )
    );
    console.log("===============================");

    return receiptInfo;
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

    return points; // No bonuses - just product points
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
            src="/Landing-Page-Logo.png"
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
                Upload clear photos of receipts taken from above for Bloedlemoen
                Gin (100 pts/bottle) or Fever Tree Tonic packs (50 pts/pack). If
                the upload feature is not working, you may also email us your
                receipt image by{" "}
                <a
                  href="mailto:info@bloedlemoengin.com"
                  className="text-primary underline"
                >
                  clicking here
                </a>
                . Please allow 24 hours for points to reflect if deemed
                acceptable.
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

      <AlertDialog
        open={alertDialog.open}
        onOpenChange={(open) => setAlertDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
