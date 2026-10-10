import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "../ui/styles.css";

export const metadata: Metadata = {
  title: "Scope to Deposit",
  description: "Turn a client brief into an approved scope and a verified sandbox deposit.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={GeistSans.className}><body>{children}</body></html>;
}
