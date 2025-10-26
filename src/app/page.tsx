import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="container mx-auto flex items-center justify-between p-6">
        <div className="text-2xl font-bold text-primary">RadiantClaims</div>
        <Link href="/login">
          <Button variant="outline">Admin Login</Button>
        </Link>
      </nav>

      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900">
            Welcome to RadiantClaims
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            Streamlined RECA claims intake process. Start your claim submission
            today with our simple and secure platform.
          </p>
          <Link href="/intake">
            <Button size="lg" className="text-lg">
              Start Intake Process
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Simple Process</CardTitle>
              <CardDescription>
                Easy-to-follow steps guide you through the entire intake
                process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our streamlined form makes it easy to submit your information
                and required documents.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secure Upload</CardTitle>
              <CardDescription>
                Your documents are safely encrypted and stored
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We use industry-standard security measures to protect your
                sensitive information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fast Processing</CardTitle>
              <CardDescription>
                Quick turnaround on claim submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our team reviews submissions promptly to get your claim moving
                forward.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mt-16 max-w-3xl rounded-lg bg-blue-50 p-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Have a referral code?
          </h2>
          <p className="mb-4 text-gray-600">
            If you were referred to RadiantClaims, you can enter your referral
            code during the intake process to help us serve you better.
          </p>
          <Link href="/intake">
            <Button variant="outline">Start with Referral Code</Button>
          </Link>
        </div>
      </main>

      <footer className="container mx-auto mt-20 border-t p-6 text-center text-sm text-gray-600">
        <p>&copy; 2024 RadiantClaims. All rights reserved.</p>
      </footer>
    </div>
  );
}
