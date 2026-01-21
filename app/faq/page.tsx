"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "General",
      questions: [
        {
          q: "What is Primenivaas?",
          a: "Primenivaas is a leading real estate platform that connects buyers, sellers, and renters directly. We simplify the property search process with verified listings and direct communication tools."
        },
        {
          q: "Is Primenivaas free to use?",
          a: "Yes, searching for properties and contacting owners is completely free for buyers and tenants. Property owners can also list their first property for free."
        }
      ]
    },
    {
      category: "For Buyers & Tenants",
      questions: [
        {
          q: "How do I contact a property owner?",
          a: "You can contact property owners directly through our built-in chat system, or by using the phone/email details provided on the property listing page."
        },
        {
          q: "Are the property photos real?",
          a: "We have a strict verification process. Listings marked as 'Verified' have been checked by our team or have been provided by trusted partners."
        }
      ]
    },
    {
      category: "For Sellers & Landlords",
      questions: [
        {
          q: "How do I list my property?",
          a: "Simply create an account, click on 'Manage Property' in the menu, and select 'Add New Property'. Follow the steps to add photos and details."
        },
        {
          q: "How long does it take for my listing to go live?",
          a: "Most listings are reviewed and published within 24 hours. You will receive a notification once your listing is active."
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about Primenivaas
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-8">
          {filteredFaqs.map((category, catIndex) => (
            <div key={catIndex} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">{category.category}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {category.questions.map((faq, index) => {
                  const globalIndex = catIndex * 100 + index; // Unique ID for state
                  const isOpen = openIndex === globalIndex;
                  
                  return (
                    <div key={index} className="px-6 py-4">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        className="w-full flex justify-between items-start text-left focus:outline-none"
                      >
                        <span className={`font-medium ${isOpen ? 'text-blue-600' : 'text-gray-900'}`}>
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="mt-3 text-gray-600 leading-relaxed animate-fadeIn">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No results found for &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Can&apos;t find what you&apos;re looking for?{" "}
            <a href="/contact" className="text-blue-600 font-medium hover:text-blue-700 hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
