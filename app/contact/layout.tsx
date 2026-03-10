import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Prime Nivaas | Get in Touch for Property Support",
  description: "Contact Prime Nivaas for any queries related to buying, selling, or renting properties. We are here to help you 24/7.",
  keywords: "contact prime nivaas, real estate support, customer care, property help, noida real estate office",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Prime Nivaas | Get in Touch",
    description: "Have questions? Contact our support team for assistance with your property journey.",
    url: "https://www.primenivaas.com/contact",
    siteName: "Prime Nivaas",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Prime Nivaas Contact",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
