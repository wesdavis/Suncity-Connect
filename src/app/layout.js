import { Outfit } from "next/font/google";
import "./globals.css";

// Import the premium Outfit font and map it correctly to Tailwind's --font-sans
const outfit = Outfit({
  variable: "--font-sans", 
  subsets: ["latin"],
});

export const metadata = {
  title: "Sun City Connect | Client Portal",
  description: "AI Sales Automation Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      {/* Forcing font-sans here ensures the entire app inherits the new font */}
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}