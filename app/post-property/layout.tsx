import { Metadata } from "next";

export const metadata: Metadata = {
  title: "3 bhk house for sale in noida,house for sale in noida sector 62,house for sale in noida extension",
  description: "If you are planning to buy office space in Noida, this property offers an excellent opportunity for businesses and investors. Located in a prime commercial area, this office space provides modern infrastructure, great connectivity, and a professional environment for companies of all sizes.",
  keywords: "ready to move flats in noida,flats for sale in noida extension,buy apartment in noida",
  alternates: {
    canonical: "/post-property",
  },
  openGraph: {
    title: "Post Property for Rent or Sale | Free Listing",
    description: "List your property on Prime Nivaas and reach thousands of buyers and tenants. Simple, fast, and free.",
    url: "https://www.primenivaas.com/post-property",
    siteName: "Prime Nivaas",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Post Property Prime Nivaas",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function PostPropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
