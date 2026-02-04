import HomeContent from "../home/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Properties | Prime Nivaas",
  description: "Explore premium properties for sale. Buy your dream home, apartment, or villa on Prime Nivaas.",
  alternates: {
    canonical: "/buy",
  },
};

export default function BuyPage() {
  return <HomeContent initialTab="Buy" showHero={false} />;
}
