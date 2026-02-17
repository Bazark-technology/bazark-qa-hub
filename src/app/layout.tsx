import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";



const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bazark QA - AI-Powered QA Testing Dashboard",
  description: "AI-Powered QA Testing Dashboard for automated testing and quality assurance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bricolage.variable} font-bricolage antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
