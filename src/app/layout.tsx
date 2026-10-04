import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devbhoomi Electrics — Electric scooter showroom, Dehradun",
  description:
    "Browse electric scooters, compare range options and prices, see your monthly petrol savings, and chat with sellers. Devbhoomi Electrics, Prem Nagar, Dehradun.",
};

export const viewport: Viewport = {
  themeColor: "#0f6b3c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
