import { Target, Eye, Shield, Users, Home, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import Breadcrumbs from "../components/Breadcrumbs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Prime Nivaas | Trusted Real Estate Platform in India",
  description: "Learn about Prime Nivaas, our mission to revolutionize real estate, and our vision to be India's most trusted property platform for buying, selling, and renting.",
  keywords: "about prime nivaas, real estate company, property platform india, real estate mission, vision values",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Prime Nivaas | Trusted Real Estate Platform",
    description: "We are building a transparent, efficient, and user-friendly platform to make your property journey seamless.",
    url: "https://www.primenivaas.com/about",
    siteName: "Prime Nivaas",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Prime Nivaas Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Prime Nivaas",
    "description": "Learn about Prime Nivaas, our mission to revolutionize real estate, and our vision to be India's most trusted property platform.",
    "publisher": {
      "@type": "Organization",
      "name": "Prime Nivaas",
      "logo": {
        "@type": "ImageObject",
        "url": "https://primenivaas.com/logo.png"
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Script
        id="about-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumbs
            items={[
              { label: "About Us" }
            ]}
          />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-[#0085FF] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Redefining Real Estate in India</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
            We are building a transparent, efficient, and user-friendly platform to make your property journey seamless.
          </p>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Mission */}
          <div className="bg-blue-50 rounded-3xl p-10 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target size={120} className="text-[#0085FF]" />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Target className="w-8 h-8 text-[#0085FF]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                To revolutionize the real estate experience by providing a transparent, efficient, and user-centric platform that connects buyers, sellers, and renters seamlessly. We aim to eliminate the complexities of property transactions and empower our users with accurate information and verified listings.
              </p>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-gray-900 rounded-3xl p-10 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Eye size={120} className="text-white" />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Our Vision</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                To be the most trusted and preferred real estate platform in India, creating a world where every individual can find their perfect home with confidence and ease. We envision a future where technology bridges the gap between dreams and reality in the property market.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Prime Nivaas?</h2>
            <p className="text-xl text-gray-600">Built on a foundation of trust and innovation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">100% Verified Listings</h3>
              <p className="text-gray-600">
                We strictly verify every property listed on our platform to ensure you only see genuine and legal options.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-[#0085FF]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Direct Connections</h3>
              <p className="text-gray-600">
                Connect directly with property owners and trusted agents. No hidden middlemen, just transparent conversations.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Market Insights</h3>
              <p className="text-gray-600">
                Make informed decisions with our data-driven insights on property trends, pricing, and neighborhood guides.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#0085FF] mb-2">5000+</div>
              <div className="text-gray-600 font-medium">Properties Listed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0085FF] mb-2">2000+</div>
              <div className="text-gray-600 font-medium">Happy Families</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0085FF] mb-2">50+</div>
              <div className="text-gray-600 font-medium">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0085FF] mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Support Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to find your dream home?</h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Join thousands of satisfied users who have found their perfect property with Prime Nivaas.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/buy" 
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-[#0085FF] rounded-full hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5 mr-2" />
            Browse Properties
          </Link>
          <Link 
            href="/contact" 
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
