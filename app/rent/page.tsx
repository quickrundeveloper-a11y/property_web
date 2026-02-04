import HomeContent from "../home/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rent Properties | Prime Nivaas",
  description: "Find the best rental properties, apartments, and houses for rent on Prime Nivaas.",
  alternates: {
    canonical: "/rent",
  },
};

export default function RentPage() {
  return <HomeContent initialTab="Rent" showHero={false} />;
}
