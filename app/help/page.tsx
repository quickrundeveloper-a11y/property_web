import Link from "next/link";
import { Search, HelpCircle, Shield, FileText, User, MessageCircle } from "lucide-react";

export default function HelpCenterPage() {
  const categories = [
    {
      icon: User,
      title: "Account & Profile",
      description: "Manage your account settings, password, and preferences.",
      link: "/profile"
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Learn how we keep Primenivaas safe for everyone.",
      link: "/trust-safety"
    },
    {
      icon: FileText,
      title: "Buying & Renting",
      description: "Everything you need to know about finding your next home.",
      link: "/guides"
    },
    {
      icon: MessageCircle,
      title: "Sell Property & Listing",
      description: "Tips for listing your property and finding buyers.",
      link: "/guides"
    }
  ];

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "Go to the login page and click 'Forgot Password'. Follow the instructions sent to your email."
    },
    {
      question: "Is it free to list a property?",
      answer: "Yes, listing your first property on Primenivaas is completely free. Premium options are available for more visibility."
    },
    {
      question: "How do I contact a property owner?",
      answer: "You can contact owners directly through the 'Contact' or 'Message' buttons on any property listing page."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-6">How can we help you?</h1>
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
            />
            <button className="absolute right-2 top-2 bg-blue-500 p-2 rounded-full hover:bg-blue-600 transition-colors">
              <Search className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map((category, index) => (
            <Link 
              key={index} 
              href={category.link}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
            >
              <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <category.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </Link>
          ))}
        </div>

        {/* Popular FAQs */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <HelpCircle className="w-6 h-6 mr-3 text-blue-600" />
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-semibold text-blue-600 hover:underline cursor-pointer">
                  {faq.question}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link href="/faq" className="text-blue-600 font-semibold hover:text-blue-700">
              View all FAQs &rarr;
            </Link>
          </div>
        </div>

        {/* Still need help? */}
        <div className="text-center bg-blue-50 rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Our support team is available Mon-Fri from 9am to 6pm to assist you with any questions or issues.
          </p>
          <Link 
            href="/contact" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-md hover:shadow-lg"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
