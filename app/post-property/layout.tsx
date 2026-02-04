import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post Property for Rent or Sale | Free Property Listing | Prime Nivaas",
  description: "Post your property for rent or sale on Prime Nivaas for free. Get verified leads and sell or rent your property faster. List apartments, plots, villas, and more.",
  keywords: "post property, list property free, sell property, rent property, property listing site, real estate listing, free property ads",
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
