import HomeContent from "../home/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "3 bhk house for sale in noida,house for sale in noida sector 62,house for sale in noida extension",
  description: "If you are planning to buy office space in Noida, this property offers an excellent opportunity for businesses and investors. Located in a prime commercial area, this office space provides modern infrastructure, great connectivity, and a professional environment for companies of all sizes.",
  keywords: "ready to move flats in noida,flats for sale in noida extension,buy apartment in noida",
  alternates: {
    canonical: "/buy",
  },
  openGraph: {
    title: "Buy Properties in India | Prime Nivaas",
    description: "Find your dream home today. Search verified properties for sale across top cities in India.",
    url: "https://www.primenivaas.com/buy",
    siteName: "Prime Nivaas",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Buy Properties Prime Nivaas",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function BuyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Buy Properties in India",
    "description": "Find apartments, houses, and villas for sale on Prime Nivaas.",
    "url": "https://www.primenivaas.com/buy",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Prime Nivaas",
      "url": "https://www.primenivaas.com"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent initialTab="Buy" showHero={false} />
    </>
  );
}
