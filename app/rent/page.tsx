import HomeContent from "../home/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "villas for sale in noida: property for sale in noida,flats for sale in noida,house for sale in greater noida",
  description: "If you are looking for a house for sale in Greater Noida, this property is a perfect choice for families and investors. This well-designed home offers modern facilities and a comfortable living environment in a prime location with easy access to markets, schools, hospitals, and metro connectivity.",
  keywords: "investment office space in noida,property for sale in noida,flats for sale in noida,office space for purchase in noida",
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
