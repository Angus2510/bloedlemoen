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
                <CheckCircle className="size-16 text-orange-600" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-heading font-normal text-orange-600">
                Thank You for Redeeming Your Points!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm md:text-base leading-relaxed">
              <p>
                Your Festive parcel is being packed. We aim to dispatch these
                gifts once a week so you can expect yours to arrive within 7
                working days - if you think yours is delayed please reach out to
                us at{" "}
                <a
                  href="mailto:info@bloedlemoengin.com"
                  className="text-primary underline"
                >
                  info@bloedlemoengin.com
                </a>
              </p>

              <p>
                If you collected and redeemed your points by uploading a
                physical slip from a liquor store you will receive an email from
                us confirming we received your gift order and you can just then
                sit back and wait for it to arrive - we use Courier Guy to
                deliver them so you will hear from them as they get on the road.
              </p>

              <p>
                If you shopped on Bloedlemoen Gin web-site and redeemed your
                points straight away you can expect 2 emails from us - one
                confirming your product purchase and another one - your gift
                selection. We will do our best to dispatch your products
                purchased and your gift(s) together but there is a chance they
                could arrive separately (yes-yes, we know, the AI era is amazing
                but some systems still like an analogue approach and best left
                to humans to manage - don&apos;t worry we&apos;ve got the best
                ones working on these).
              </p>

              <p>
                Lastly, all this means that you stand a real chance of winning
                one of 5 beautiful sets from Le Creuset so don&apos;t disappear
                and make sure you supplied us with your correct contact details
                - if you happen to win these are the ones we&apos;ll use to
                contact you.
              </p>

              <p>
                Of course, if at any point you have any questions please do not
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
