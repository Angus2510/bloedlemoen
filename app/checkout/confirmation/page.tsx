"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Image from "next/image";

export default function CheckoutConfirmationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Logo */}
        <div className="flex justify-center mb-6 md:mb-8">
          <Image
            src="/Landing-Page-Logo.png"
            alt="Bloedlemoen Logo"
            width={300}
            height={150}
            className="object-contain md:w-[400px] md:h-[200px]"
          />
        </div>

        {/* Confirmation Card */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <CheckCircle className="size-16 text-[#E87722]" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-heading font-normal text-[#E87722]">
                Thank You for Redeeming Your Points!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                Your Festive parcel is being packed. What&apos;s next? We run
                dispatches once a week so you can expect yours to arrive within
                7 working days - if you think it is delayed, please reach out to
                us at{" "}
                <a
                  href="mailto:info@bloedlemoengin.com"
                  className="text-primary underline"
                >
                  info@bloedlemoengin.com
                </a>
                .
              </p>

              <p>
                If you collected and redeemed your points by uploading a
                physical slip from a liquor store, you will receive a
                confirmation email from us and can then expect for the gift to
                arrive as per the above timelines - we use Courier Guy for
                deliveries, so you will hear from them as they get on the road.
              </p>

              <p>
                If you shopped on Bloedlemoen Gin website and redeemed your
                points straight away, you can expect 2 emails from us - one
                confirming your product purchase and another one - your gift
                selection. We will do our best to dispatch all of it together,
                but there is a chance that your purchased products and redeemed
                gifts could arrive separately (yes-yes, we know, the AI era is
                amazing but some systems still like an analogue approach and
                best left to humans to manage).
              </p>

              <p>
                Lastly, all this means that you stand a real chance of winning
                one of 5 beautiful sets from Le Creuset so don&apos;t disappear
                and make sure you supplied us with correct contact details - if
                you happen to win, these will be the ones we&apos;ll use to
                contact you.
              </p>

              <p>
                Of course, if at any point you have any questions, please do not
                hesitate to reach out at{" "}
                <a
                  href="mailto:info@bloedlemoengin.com"
                  className="text-primary underline"
                >
                  info@bloedlemoengin.com
                </a>
              </p>

              <div className="text-center pt-4">
                <p className="font-medium">Cheers,</p>
                <p className="font-medium">
                  Your Festive Team at Bloedlemoen Gin
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 pt-6">
                <Button
                  onClick={() => router.push("/dashboard")}
                  size="lg"
                  className="px-8"
                >
                  BACK TO DASHBOARD
                </Button>
                <Button
                  onClick={() =>
                    window.open("https://shop.bloedlemoengin.com/", "_blank")
                  }
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  SHOP MORE
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
