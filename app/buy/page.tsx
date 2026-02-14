import HomeContent from "../home/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Properties in India | Flats, Plots, Villas for Sale | Prime Nivaas",
  description: "Explore premium properties for sale. Buy your dream home, apartment, plot, or villa on Prime Nivaas. Verified listings and best deals.",
  keywords: "buy property, house for sale, plots for sale, apartments for sale, buy flat, real estate india, luxury villas",
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
