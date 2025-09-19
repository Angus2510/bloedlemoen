'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Copy the exact receipt processing logic from dashboard
const processReceiptText = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  console.log("📝 Starting product detection with", lines.length, "lines");

  for (const line of lines) {
    const cleanLine = line.trim().toLowerCase();

    console.log(`🔍 Processing line: "${line}"`);
    console.log(`   - Clean line: "${cleanLine}"`);

    // BUNDLE DETECTION: Look for Bloedlemoen + FREE Fever Tree combination
    const hasBloedlemoen = /bloedlemoen/i.test(cleanLine);
    const hasFree = /free/i.test(cleanLine);
    const hasFeverTree = /fever.*tree|tonic.*water/i.test(cleanLine); // Also detect "tonic water"
    
    // More specific bundle patterns
    const isBundlePattern = 
      /bloedlemoen.*\+.*free.*fever.*tree/i.test(cleanLine) ||
      /bloedlemoen.*\+.*free.*tonic.*water/i.test(cleanLine) ||
      /bloedlemoen.*free.*fever.*tree/i.test(cleanLine) ||
      /bloedlemoen.*free.*tonic.*water/i.test(cleanLine) ||
      (hasBloedlemoen && hasFree && hasFeverTree);

    console.log(`   - Has Bloedlemoen: ${hasBloedlemoen}`);
    console.log(`   - Has FREE: ${hasFree}`);
    console.log(`   - Has Fever Tree/Tonic: ${hasFeverTree}`);
    console.log(`   - Is Bundle Pattern: ${isBundlePattern}`);

    if (isBundlePattern) {
      console.log(`🎯 BUNDLE DETECTED: "${line}"`);
      console.log(`   - Has Bloedlemoen: ${hasBloedlemoen}`);
      console.log(`   - Has FREE: ${hasFree}`);
      console.log(`   - Has Fever Tree/Tonic: ${hasFeverTree}`);
      
      console.log(`✅ Bundle detected: 150 points awarded`);
      return { type: 'bundle', points: 150, line };
    }
    // INDIVIDUAL BLOEDLEMOEN DETECTION (if not part of bundle)
    else if (hasBloedlemoen && !isBundlePattern) {
      console.log(`🍾 INDIVIDUAL BLOEDLEMOEN DETECTED: "${line}"`);
      console.log(`   - NOT a bundle (no FREE + Fever Tree/Tonic detected)`);
      
      console.log(`✅ Individual Bloedlemoen detected: 100 points awarded`);
      return { type: 'individual', points: 100, line };
    }
  }
  
  return { type: 'none', points: 0, line: '' };
};

export default function TestPage() {
  const [testText, setTestText] = useState("Bloedlemoen 750ml + FREE Fever Tree Tonic Water (Pack of 4)");
  const [result, setResult] = useState<{type: string, points: number, line: string} | null>(null);

  const runTest = () => {
    console.clear();
    console.log("🧪 TESTING BUNDLE DETECTION");
    console.log("Input text:", testText);
    
    try {
      const result = processReceiptText(testText);
      setResult(result);
      console.log("Final result:", result);
      alert(`Test complete! Check console. Result: ${result.type} - ${result.points} points`);
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
            onClick={() => alert("Button is working! Now try the test button above.")}
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            ✅ Test if buttons work
          </button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold">Result:</h3>
              <p><strong>Type:</strong> {result.type}</p>
              <p><strong>Points:</strong> {result.points}</p>
              <p><strong>Line:</strong> &quot;{result.line}&quot;</p>
              
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
