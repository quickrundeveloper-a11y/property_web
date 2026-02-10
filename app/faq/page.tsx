"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search, MessageCircle, Mail, Phone } from "lucide-react";
import Link from "next/link";
import Script from "next/script";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "General Information",
      questions: [
        {
          q: "What is Prime Nivaas?",
          a: "Prime Nivaas is a comprehensive real estate platform designed to simplify buying, selling, and renting properties. We connect property seekers directly with owners and trusted agents, ensuring a seamless and transparent experience."
        },
        {
          q: "Is Prime Nivaas free to use?",
          a: "Yes, browsing properties and contacting sellers/owners is completely free for buyers and tenants. Property owners can also list their properties for free, with premium options available for higher visibility."
        },
        {
          q: "Do I need to register to search for properties?",
          a: "No, you can search and view property details without registration. However, creating a free account allows you to save favorites, contact owners, and get personalized recommendations."
        },
        {
          q: "Is my personal information safe with Prime Nivaas?",
          a: "Absolutely. We prioritize user privacy and data security. Your contact details are only shared with property owners/agents when you explicitly choose to contact them."
        }
      ]
    },
    {
      category: "For Buyers",
      questions: [
        {
          q: "How do I search for a property on Prime Nivaas?",
          a: "You can use the search bar on the homepage to filter properties by location, type (Rent/Buy), budget, and category (Apartment, Villa, Plot, etc.)."
        },
        {
          q: "How can I contact the property owner?",
          a: "Once you find a property you like, click on the 'Contact Owner' or 'Chat' button. You'll need to be logged in to view their phone number or start a chat."
        },
        {
          q: "What should I check before buying a property?",
          a: "We recommend verifying the title deed, checking for encumbrances, ensuring all approvals are in place (like RERA registration), and physically inspecting the property before making any payments."
        },
        {
          q: "Can I get a home loan through Prime Nivaas?",
          a: "While we don't provide loans directly, we can connect you with our banking partners who offer competitive home loan rates for properties listed on our platform."
        },
        {
          q: "What are the additional costs when buying a property?",
          a: "Apart from the property cost, you should budget for Stamp Duty and Registration charges (usually 5-7% of property value), GST (for under-construction properties), and maintenance deposits."
        }
      ]
    },
    {
      category: "For Renters / Tenants",
      questions: [
        {
          q: "Do I have to pay brokerage to rent a house?",
          a: "Many listings on Prime Nivaas are directly from owners, meaning zero brokerage. However, if you choose a property listed by an agent, a standard brokerage fee may apply."
        },
        {
          q: "What is a security deposit?",
          a: "A security deposit is a refundable amount paid to the landlord at the start of the lease to cover any potential damages. It is usually equivalent to 2-6 months of rent."
        },
        {
          q: "What is a rental agreement?",
          a: "A rental agreement is a legal contract between the landlord and tenant outlining the terms of the tenancy, including rent amount, deposit, duration, and rules. It is mandatory for a valid tenancy."
        },
        {
          q: "Can I find PG or Co-living spaces on Prime Nivaas?",
          a: "Yes! We have a dedicated section for PGs and Co-living spaces. You can filter by gender (Male/Female/Unisex) and amenities like food, WiFi, and housekeeping."
        },
        {
          q: "What happens if I need to move out early?",
          a: "This depends on the 'Lock-in Period' clause in your rental agreement. Usually, you need to provide a notice (often 1 month) or pay the rent for the notice period."
        }
      ]
    },
    {
      category: "For Sellers & Landlords",
      questions: [
        {
          q: "How do I post a property for rent or sale?",
          a: "Log in to your account, click 'Post Property' or 'Manage Property', and fill in the details like location, photos, price, and amenities. Your listing will go live after a quick verification."
        },
        {
          q: "How can I sell my property faster?",
          a: "To sell faster, ensure you upload high-quality photos, write a detailed description, price it competitively, and respond to buyer inquiries promptly. You can also opt for our 'Featured Listing' packages."
        },
        {
          q: "What documents do I need to sell my property?",
          a: "Key documents include the Sale Deed, Mother Deed, Property Tax receipts, Khata certificate, and an Encumbrance Certificate (EC). For apartments, an Occupancy Certificate (OC) is also important."
        },
        {
          q: "Can I edit my property details after posting?",
          a: "Yes, you can edit your listing at any time from your 'Manage Property' dashboard to update the price, photos, or description."
        },
        {
          q: "Is it mandatory to add photos?",
          a: "While not mandatory, listings with photos receive 5x more inquiries than those without. We highly recommend adding at least 3-5 clear images of the property."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "I forgot my password. How can I reset it?",
          a: "Click on 'Login', then select 'Forgot Password'. Enter your registered email address, and we'll send you a link to reset your password."
        },
        {
          q: "How do I report a fake or incorrect listing?",
          a: "If you find any suspicious listing, please click the 'Report' button on the property page or email us at support@primenivaas.com with the listing ID."
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  // Schema.org JSON-LD for FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.flatMap(cat => cat.questions).map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Hero Section */}
        <div className="bg-[#0085FF] text-white py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">
              How can we help you?
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Find answers to the most frequently asked questions about buying, renting, and selling on Prime Nivaas.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-[#0085FF] transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 placeholder-gray-500 bg-white shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400/30 transition-shadow text-lg"
                placeholder="Search questions (e.g., brokerage, deposit, selling)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* FAQs Content */}
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 -mt-8">
          {filteredFaqs.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500">Try searching for different keywords</p>
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mt-6 text-[#0085FF] font-semibold hover:underline"
                >
                  View all questions
                </button>
             </div>
          ) : (
            <div className="space-y-10">
              {filteredFaqs.map((category, catIndex) => (
                <div key={catIndex} className="animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1 bg-[#0085FF] rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-900">{category.category}</h2>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {category.questions.map((faq, index) => {
                        const globalIndex = catIndex * 100 + index;
                        const isOpen = openIndex === globalIndex;
                        
                        return (
                          <div key={index} className="transition-colors hover:bg-gray-50/50">
                            <button
                              onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                              className="w-full px-6 py-5 flex justify-between items-start text-left focus:outline-none group"
                              aria-expanded={isOpen}
                            >
                              <span className={`text-lg font-medium pr-8 transition-colors ${isOpen ? 'text-[#0085FF]' : 'text-gray-800 group-hover:text-gray-900'}`}>
                                {faq.q}
                              </span>
                              <span className={`ml-6 flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full border transition-all ${isOpen ? 'bg-[#0085FF] border-[#0085FF] rotate-180' : 'bg-white border-gray-200 group-hover:border-gray-300'}`}>
                                {isOpen ? (
                                  <ChevronUp className="h-5 w-5 text-white" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-gray-500" />
                                )}
                              </span>
                            </button>
                            
                            <div 
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                              <div className="px-6 pb-6 pt-0 text-gray-600 leading-relaxed">
                                {faq.a}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Support Section */}
        <div className="bg-white border-t border-gray-200 py-16 mt-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Still have questions?</h2>
            <p className="text-gray-600 mb-10 max-w-xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help you.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
               <Link href="/contact" className="flex items-center justify-center gap-3 p-6 rounded-2xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md transition-all group">
                  <div className="bg-blue-100 p-3 rounded-full text-[#0085FF] group-hover:bg-[#0085FF] group-hover:text-white transition-colors">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Chat with us</div>
                    <div className="text-sm text-gray-500">Get instant answers</div>
                  </div>
               </Link>

               <a href="mailto:support@primenivaas.com" className="flex items-center justify-center gap-3 p-6 rounded-2xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md transition-all group">
                  <div className="bg-blue-100 p-3 rounded-full text-[#0085FF] group-hover:bg-[#0085FF] group-hover:text-white transition-colors">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Email Support</div>
                    <div className="text-sm text-gray-500">Response within 24h</div>
                  </div>
               </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
