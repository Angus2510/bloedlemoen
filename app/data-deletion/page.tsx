"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
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
import { ArrowLeft, AlertTriangle, Trash2 } from "lucide-react";

export default function DataDeletionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Confirm, 3: Processing

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

  const handleDeleteRequest = async () => {
    if (confirmText !== "DELETE MY DATA") {
      alert("Please type 'DELETE MY DATA' exactly to confirm.");
      return;
    }

    setIsDeleting(true);
    setStep(3);

    try {
      // In a real app, you would call your API to process the deletion
      // const response = await fetch('/api/delete-user-data', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId: session?.user?.id })
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert(
        "Data deletion request submitted successfully. You will receive a confirmation email within 24 hours."
      );
      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting deletion request:", error);
      alert(
        "An error occurred while submitting your request. Please try again."
      );
      setStep(2);
    } finally {
      setIsDeleting(false);
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
              <span className="hidden sm:inline">BACK</span>
              <span className="sm:hidden">BACK</span>
            </Button>
            <h1 className="text-lg md:text-xl font-heading">DATA DELETION</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-2xl md:text-3xl font-normal flex items-center gap-2">
                <AlertTriangle className="size-6 text-destructive" />
                USER DATA DELETION
              </CardTitle>
              <CardDescription>
                Request permanent deletion of your account and all associated
                data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm md:text-base">
              {/* Warning Notice */}
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-destructive mb-2">
                      Warning: This action cannot be undone
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Once you submit a data deletion request, all your account
                      information will be permanently removed from our systems
                      within 30 days.
                    </p>
                  </div>
                </div>
              </div>

              {/* What Will Be Deleted */}
              <section>
                <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                  WHAT WILL BE DELETED
                </h2>
                <div className="space-y-2">
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Your account profile and login credentials</li>
                    <li>All uploaded receipt images and OCR data</li>
                    <li>Points balance and reward history</li>
                    <li>Transaction and activity logs</li>
                    <li>Personal preferences and settings</li>
                    <li>Any communications or support tickets</li>
                  </ul>
                </div>
              </section>

              {/* What Happens Next */}
              <section>
                <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                  WHAT HAPPENS NEXT
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <p className="text-muted-foreground">
                      You submit the deletion request
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <p className="text-muted-foreground">
                      We send you a confirmation email within 24 hours
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <p className="text-muted-foreground">
                      Your data is permanently deleted within 30 days
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <p className="text-muted-foreground">
                      You receive final confirmation that deletion is complete
                    </p>
                  </div>
                </div>
              </section>

              {/* Current Account Info */}
              <section className="bg-muted p-4 rounded">
                <h3 className="font-semibold mb-2">
                  Current Account Information
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <strong>Email:</strong> {session?.user?.email}
                  </p>
                  <p>
                    <strong>Name:</strong>{" "}
                    {session?.user?.name || "Not provided"}
                  </p>
                  <p>
                    <strong>Account created:</strong> Recently
                  </p>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  CANCEL
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  <Trash2 className="size-4 mr-2" />
                  PROCEED WITH DELETION
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-2xl md:text-3xl font-normal text-destructive">
                CONFIRM DATA DELETION
              </CardTitle>
              <CardDescription>
                Type &quot;DELETE MY DATA&quot; to confirm permanent deletion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded">
                <p className="text-sm font-medium text-destructive">
                  This is your final chance to cancel. Once confirmed, this
                  action cannot be reversed.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirm" className="text-sm font-medium">
                  Type &quot;DELETE MY DATA&quot; to confirm:
                </Label>
                <Input
                  id="confirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE MY DATA"
                  className="font-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  GO BACK
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteRequest}
                  disabled={confirmText !== "DELETE MY DATA" || isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4 mr-2" />
                      CONFIRM DELETION
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-2xl md:text-3xl font-normal text-center">
                PROCESSING DELETION REQUEST
              </CardTitle>
              <CardDescription className="text-center">
                Please wait while we process your request...
              </CardDescription>
            </CardHeader>
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">
                  Your data deletion request is being processed. You will
                  receive a confirmation email shortly.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
