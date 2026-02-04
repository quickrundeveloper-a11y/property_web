import HomeContent from "../home/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rent Properties in India | Apartments, Houses & Villas | Prime Nivaas",
  description: "Find your perfect rental home. Search thousands of verified apartments, houses, and villas for rent on Prime Nivaas. No brokerage options available.",
  keywords: "rent property, house for rent, apartments for rent, flats for rent, rental properties india, no brokerage rent",
  alternates: {
    canonical: "/rent",
  },
  openGraph: {
    title: "Rent Properties in India | Prime Nivaas",
    description: "Browse premium rental properties with ease. Verified listings, direct owner contacts, and more.",
    url: "https://www.primenivaas.com/rent",
    siteName: "Prime Nivaas",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Rent Properties Prime Nivaas",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RentPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Rent Properties in India",
    "description": "Find apartments, houses, and villas for rent on Prime Nivaas.",
    "url": "https://www.primenivaas.com/rent",
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
      <HomeContent initialTab="Rent" showHero={false} />
    </>
  );
}
