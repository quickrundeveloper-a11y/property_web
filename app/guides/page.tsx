import React from 'react';
import Link from 'next/link';
import { Home, Key, DollarSign, ArrowRight } from 'lucide-react';

export default function GuidesPage() {
  const guides = [
    {
      title: "Buying a Home",
      description: "Everything you need to know about finding and purchasing your dream home.",
      icon: <Home className="w-8 h-8 text-blue-600" />,
      color: "bg-blue-50",
      slug: "buying"
    },
    {
      title: "Posting Your Property",
      description: "Tips for staging, pricing, and marketing your property to get the best deal.",
      icon: <DollarSign className="w-8 h-8 text-green-600" />,
      color: "bg-green-50",
      slug: "selling"
    },
    {
      title: "Renting Guide",
      description: "A complete guide for tenants on finding the perfect rental and understanding leases.",
      icon: <Key className="w-8 h-8 text-purple-600" />,
      color: "bg-purple-50",
      slug: "renting"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Property Guides</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Expert advice and resources to help you navigate your real estate journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {guides.map((guide, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group">
              <div className="p-8">
                <div className={`${guide.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                  {guide.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{guide.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {guide.description}
                </p>
                <Link href="#" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                  Read Guide <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Articles Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">Tips</span>
                    <span className="mx-2">•</span>
                    <span>5 min read</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Top 10 Things to Look for When Buying a House
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Don&apos;t make a costly mistake. detailed checklist of what to inspect before you make an offer.
                  </p>
                  <Link href="#" className="text-blue-600 text-sm font-semibold hover:underline">
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
