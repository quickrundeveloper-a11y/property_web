import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});
import ConditionalLayout from "./conditional-layout";
import { AuthProvider } from "@/lib/auth-context";
import { ChatProvider } from "@/app/context/ChatContext";
import ChatModal from "@/app/components/chat/ChatModal";
import FloatingChatButton from "@/app/components/chat/FloatingChatButton";

export const metadata: Metadata = {
  title: "Prime Nivaas: Buy, Sell & Rent Plots, Homes or Villas",
  description:
    "Looking for the best property? Prime Nivaas helps you buy, sell, or rent premium plots, homes, and villas effortlessly. Find your dream property today!",
  keywords:
    "real estate, buy plots, luxury villas for sale, homes for rent, post property, prime nivaas, residential land, rental houses, property listings, investment plots",
  verification: {
    google: "qBe16FRPwxEAzJtxNw-JaEp-3Ixz_JaTH26PORx9DPM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateAgent",
        "@id": "https://www.primenivaas.com/#organization",
        "name": "Prime Nivaas",
        "url": "https://www.primenivaas.com",
        "description": "Looking for the best property? Prime Nivaas helps you buy, sell, or rent premium plots, homes, and villas effortlessly.",
        "telephone": "+91 98765 43210",
        "email": "support@primenivaas.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "407, A-16 I-thum Height, Sector 62",
          "addressLocality": "Noida",
          "addressRegion": "Uttar Pradesh",
          "addressCountry": "IN"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "150",
          "bestRating": "5",
          "worstRating": "1"
        },
        "priceRange": "₹₹₹",
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday"
          ],
          "opens": "09:00",
          "closes": "18:00"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://www.primenivaas.com/#website",
        "url": "https://www.primenivaas.com",
        "name": "Prime Nivaas",
        "publisher": {
          "@id": "https://www.primenivaas.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://www.primenivaas.com/home?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "ItemList",
        "@id": "https://www.primenivaas.com/#sitelinks",
        "name": "Important Pages",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": "Buy Properties",
            "description": "Explore premium properties for sale",
            "url": "https://www.primenivaas.com/home?filter=Buy"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": "Rent Properties",
            "description": "Find the best rental homes and flats",
            "url": "https://www.primenivaas.com/home?filter=Rent"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": "Sell Your Property",
            "description": "List your property for sale or rent",
            "url": "https://www.primenivaas.com/add-property"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": "About Us",
            "description": "Learn more about Prime Nivaas",
            "url": "https://www.primenivaas.com/company"
          }
        ]
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lexend.variable} antialiased font-sans`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <ChatProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <ChatModal />
            <FloatingChatButton />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
