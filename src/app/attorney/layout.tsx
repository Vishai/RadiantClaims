import type { Metadata } from "next";
import AttorneyClientLayout from "./AttorneyClientLayout";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AttorneyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AttorneyClientLayout>{children}</AttorneyClientLayout>;
}
