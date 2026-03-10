import { Metadata } from 'next';

export async function generateMetadata({ searchParams }: { searchParams: { location?: string } }): Promise<Metadata> {
  const location = searchParams?.location;

  if (location && ['Noida', 'Goa', 'Dehradun'].map(l => l.toLowerCase()).includes(location.toLowerCase())) {
    return {
      title: "3 bhk house for sale in noida,house for sale in noida sector 62,house for sale in noida extension",
      keywords: "ready to move flats in noida,flats for sale in noida extension,buy apartment in noida",
      description: "If you are planning to buy office space in Noida, this property offers an excellent opportunity for businesses and investors. Located in a prime commercial area, this office space provides modern infrastructure, great connectivity, and a professional environment for companies of all sizes.",
    };
  }

  return {
    title: 'Property Search',
    description: 'Search for properties in various locations.',
  };
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
