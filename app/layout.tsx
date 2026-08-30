import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Startup Tycoon",
  description: "Build, grow, and dominate your market.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
