import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | Prime Nivaas",
  description: "Find answers to common questions about buying, selling, and renting properties on Prime Nivaas. Your guide to real estate in India.",
  keywords: "real estate faq, property questions, buying guide, selling tips, renting help, prime nivaas help",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | Prime Nivaas",
    description: "Get answers to all your real estate queries. Check our FAQ section for instant help.",
    url: "https://www.primenivaas.com/faq",
    siteName: "Prime Nivaas",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Prime Nivaas FAQ",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
