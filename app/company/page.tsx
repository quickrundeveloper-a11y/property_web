import type { Metadata } from "next";
import { Lexend } from "next/font/google";

const lexend = Lexend({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "About – Primenivaas",
};

export default function AboutCompanyPage() {
  return (
    <main className={`${lexend.className} min-h-screen bg-gray-50`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About Our Company</h1>

        <div className="space-y-6 text-gray-800 leading-relaxed">
          <p>
            Primenivaas is a modern real estate platform designed to make buying, selling, and renting
            properties simple, secure, and transparent. We connect property owners, buyers, and tenants
            through a trusted digital marketplace that focuses on genuine listings and a smooth user
            experience.
          </p>

          <p>
            At Primenivaas, we understand that property decisions are important life milestones. That&apos;s
            why we are committed to offering verified properties, clear information, and easy communication,
            helping our users make confident and informed choices.
          </p>

          <p>
            Our platform features a wide range of properties including residential plots, apartments,
            independent houses, villas, and rental properties. With advanced search tools, location-based
            listings, and secure contact options, Primenivaas ensures convenience at every step.
          </p>

          <p>
            Driven by innovation and integrity, we strive to redefine real estate services by putting
            customer trust first. Whether you are a homebuyer, investor, tenant, or property owner,
            Primenivaas is your reliable partner in finding the right property.
          </p>
        </div>
      </div>
    </main>
  );
}

