"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Copy the exact receipt processing logic from dashboard
const processReceiptText = (text: string) => {
  const lines = text.split("\n").filter((line) => line.trim());

  console.log("📝 Starting product detection with", lines.length, "lines");

  let totalPoints = 0;
  const detectedProducts: string[] = [];
  let hasBloedlemoen = false;
  let hasFeverTree = false;

  for (const line of lines) {
    const cleanLine = line.trim().toLowerCase();

    console.log(`🔍 Processing line: "${line}"`);
    console.log(`   - Clean line: "${cleanLine}"`);

    // BLOEDLEMOEN DETECTION (100 points)
    if (/bloedlemoen/i.test(cleanLine) && !hasBloedlemoen) {
      console.log(`🍾 BLOEDLEMOEN DETECTED: "${line}"`);
      totalPoints += 100;
      detectedProducts.push("Bloedlemoen Gin 750ml (100 pts)");
      hasBloedlemoen = true;
    }

    // FEVER TREE DETECTION (50 points)
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
    ];

    const hasFeverTreeInLine = feverTreePatterns.some((pattern) =>
      pattern.test(cleanLine)
    );

    if (hasFeverTreeInLine && !hasFeverTree) {
      console.log(`🥤 FEVER TREE DETECTED: "${line}"`);
      totalPoints += 50;
      detectedProducts.push("Fever Tree Tonic Water (50 pts)");
      hasFeverTree = true;
    }
  }

  console.log(`📊 Final Summary:`);
  console.log(`   - Bloedlemoen detected: ${hasBloedlemoen}`);
  console.log(`   - Fever Tree detected: ${hasFeverTree}`);
  console.log(`   - Total points: ${totalPoints}`);
  console.log(`   - Products found: ${detectedProducts.join(", ")}`);

  return {
    type:
      totalPoints === 150
        ? "bundle"
        : totalPoints === 100
        ? "bloedlemoen-only"
        : totalPoints === 50
        ? "fever-tree-only"
        : "none",
    points: totalPoints,
    line: detectedProducts.join(" + "),
    products: detectedProducts,
  };
};

export default function TestPage() {
  const [testText, setTestText] = useState(
    "Bloedlemoen 750ml + FREE Fever Tree Tonic Water (Pack of 4)"
  );
  const [result, setResult] = useState<{
    type: string;
    points: number;
    line: string;
    products: string[];
  } | null>(null);

  const runTest = () => {
    console.clear();
    console.log("🧪 TESTING BUNDLE DETECTION");
    console.log("Input text:", testText);

    try {
      const result = processReceiptText(testText);
      setResult(result);
      console.log("Final result:", result);
      alert(
        `Test complete! Check console. Result: ${result.type} - ${result.points} points`
      );
    } catch (error) {
      console.error("Error during test:", error);
      alert("Error during test - check console");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🧪 Bundle Detection Test</CardTitle>
          <CardDescription>
            Test the bundle detection logic without authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Text:</label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full p-3 border rounded-md h-32"
              placeholder="Enter receipt text to test..."
            />
          </div>

          <Button onClick={runTest} className="w-full">
            🔍 Test Detection
          </Button>

          <button
            onClick={() =>
              alert("Button is working! Now try the test button above.")
            }
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            ✅ Test if buttons work
          </button>

          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold">Result:</h3>
              <p>
                <strong>Type:</strong> {result.type}
              </p>
              <p>
                <strong>Points:</strong> {result.points}
              </p>
              <p>
                <strong>Products:</strong> {result.products.join(", ")}
              </p>

              <div className="mt-2 text-sm text-gray-600">
                <p>✅ Open browser console (F12) to see detailed logs</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
