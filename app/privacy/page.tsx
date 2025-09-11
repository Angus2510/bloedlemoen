"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const router = useRouter();

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
            <h1 className="text-lg md:text-xl font-heading">PRIVACY POLICY</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl md:text-3xl font-normal">
              PRIVACY POLICY
            </CardTitle>
            <CardDescription>
              Last updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm md:text-base">
            {/* Introduction */}
            <section>
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                1. INTRODUCTION
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to the Bloedlemoen Campaign (&quot;we,&quot;
                &quot;our,&quot; or &quot;us&quot;). This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our mobile application and website (the
                &quot;Service&quot;). Please read this privacy policy carefully.
                If you do not agree with the terms of this privacy policy,
                please do not access the application.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                2. INFORMATION WE COLLECT
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may collect personal information such as your name, email
                    address, and profile information when you create an account
                    or sign in through social media providers (Google, Facebook,
                    Apple).
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Receipt Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you upload receipt images, we process them using
                    Optical Character Recognition (OCR) technology to extract
                    text data for point calculation purposes.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Usage Data</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect information about your interactions with the
                    Service, including points earned, rewards redeemed, and app
                    usage patterns.
                  </p>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                3. HOW WE USE YOUR INFORMATION
              </h2>
              <div className="space-y-2">
                <p className="text-muted-foreground leading-relaxed">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Provide and maintain our Service</li>
                  <li>Process receipt uploads and calculate points</li>
                  <li>Manage your account and rewards</li>
                  <li>
                    Send you updates about your account and promotional offers
                  </li>
                  <li>Improve our Service and user experience</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                4. INFORMATION SHARING
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal
                information to third parties without your consent, except as
                described in this policy. We may share information with trusted
                service providers who assist us in operating our Service,
                conducting our business, or serving our users.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                5. DATA SECURITY
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction. However, no method of transmission
                over the internet or electronic storage is 100% secure.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                6. DATA RETENTION
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information only as long as necessary to
                fulfill the purposes outlined in this Privacy Policy, unless a
                longer retention period is required by law.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                7. YOUR RIGHTS
              </h2>
              <div className="space-y-2">
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Object to processing of your information</li>
                  <li>Data portability</li>
                  <li>Withdraw consent at any time</li>
                </ul>
                <div className="mt-4 p-3 bg-muted rounded border-l-4 border-primary">
                  <p className="text-sm font-medium mb-2">
                    Request Data Deletion:
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    If you want to permanently delete your account and all
                    associated data, you can submit a deletion request.
                  </p>
                  <Link
                    href="/data-deletion"
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                  >
                    Request Data Deletion →
                  </Link>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                8. THIRD-PARTY SERVICES
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service may contain links to third-party websites or
                integrate with third-party services (such as social media login
                providers). We are not responsible for the privacy practices of
                these third parties.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                9. CHILDREN&apos;S PRIVACY
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not intended for children under the age of 13. We
                do not knowingly collect personal information from children
                under 13.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                10. CHANGES TO THIS PRIVACY POLICY
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-muted p-4 rounded border-l-4 border-primary">
              <h2 className="font-heading text-lg md:text-xl font-normal mb-3">
                11. CONTACT US
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please
                contact us at:
              </p>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <p>Email: privacy@bloedlemoen.com</p>
                <p>Address: [Your Company Address]</p>
                <p>Phone: [Your Phone Number]</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
