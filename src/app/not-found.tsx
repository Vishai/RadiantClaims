import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6">
      <div className="w-full max-w-xl rounded-2xl border border-cream-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-sage-900">
          Page Not Found
        </h1>
        <p className="mb-6 text-sage-700">
          The page you requested could not be found.
        </p>
        <Button
          asChild
          className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
        >
          <Link href="/portal">Return to Portal</Link>
        </Button>
      </div>
    </div>
  );
}
