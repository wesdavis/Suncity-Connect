import { Outfit } from "next/font/google";
import "./globals.css";

// Import the premium Outfit font and map it correctly to Tailwind's --font-sans
const outfit = Outfit({
  variable: "--font-sans", 
  subsets: ["latin"],
});

export const metadata = {
  title: "Sun City Connect | AI Sales Automation",
  description: "We build 24/7 custom AI sales assistants for local businesses. Stop typing. Start closing.",
  openGraph: {
    title: "Sun City Connect | AI Sales Automation",
    description: "Never miss a late-night DM or lose another lead to a competitor. See how our AI agents can automate your inbox 24/7.",
    url: 'https://suncityconnect.com', // Update this to your actual live domain if different
    siteName: 'Sun City Connect',
    images: [
      {
        url: '/assets/SCC_logo.png', // This tells iMessage/Facebook to use your logo for the link preview!
        width: 800,
        height: 600,
        alt: 'Sun City Connect Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
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