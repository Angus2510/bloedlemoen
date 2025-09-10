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
import { Upload, Camera, Trophy, LogOut } from "lucide-react";
import { createWorker } from "tesseract.js";

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

      // Mock point calculation based on OCR result
      if (
        text.toLowerCase().includes("bloedlemoen") ||
        text.toLowerCase().includes("receipt")
      ) {
        const newPoints = points + 50;
        setPoints(newPoints);
        alert(
          `Receipt verified! You earned 50 points. Total: ${newPoints} points`
        );
      } else {
        alert(
          "Could not verify this receipt. Please try again with a clear image of a valid receipt."
        );
      }
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Error processing image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                <Trophy className="size-4" />
              </div>
              <h1 className="text-xl font-bold">Bloedlemoen Campaign</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {session?.user?.name || session?.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Points Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-5" />
                Your Points
              </CardTitle>
              <CardDescription>
                Accumulate points by uploading valid receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {points}
                </div>
                <p className="text-muted-foreground">Total Points Earned</p>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="size-5" />
                Upload Receipt
              </CardTitle>
              <CardDescription>
                Upload a clear image of your receipt to earn points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="receipt">Receipt Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    size="sm"
                  >
                    <Upload className="size-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Processing image with OCR...
                </div>
              )}

              {ocrResult && (
                <div className="space-y-2">
                  <Label>OCR Result:</Label>
                  <div className="bg-muted p-3 rounded-md text-sm max-h-32 overflow-y-auto">
                    {ocrResult}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest point earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Receipt uploaded</p>
                  <p className="text-sm text-muted-foreground">
                    Today, 2:30 PM
                  </p>
                </div>
                <div className="text-green-600 font-medium">+50 points</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Welcome bonus</p>
                  <p className="text-sm text-muted-foreground">
                    Yesterday, 10:15 AM
                  </p>
                </div>
                <div className="text-green-600 font-medium">+100 points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
