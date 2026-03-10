import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "Top 10 Tips for First-Time Home Buyers in 2026",
      excerpt: "Navigating the real estate market can be daunting. Here are the essential tips you need to know before buying your first home.",
      author: "Sarah Johnson",
      date: "Jan 15, 2026",
      category: "Buying Guide",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      slug: "top-10-tips-first-time-home-buyers"
    },
    {
      id: 2,
      title: "Premium Student Hoslet Near UPES University – Ready to Lease",
      excerpt: "Demand for quality student hoslet is rising in India. Primenivaas offers a newly built, ready-to-lease property near UPES University, Dehradun—spanning one acre with 54 flats and capacity for 260+ students, designed for safe, modern living close to campus.",
      author: "Primenivaas Editorial",
      date: "Feb 11, 2026",
      category: "",
      image: "/hostel.jpeg",
      slug: "student-housing-upes-dehradun"
    },
    {
      id: 3,
      title: "Understanding Property Taxes and Hidden Costs",
      excerpt: "Don't let hidden costs catch you off guard. A comprehensive guide to understanding the financial aspects of property ownership.",
      author: "Priya Patel",
      date: "Jan 08, 2026",
      category: "Finance",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      slug: "understanding-property-taxes"
    },
    {
      id: 4,
      title: "Interior Design Trends to Watch This Year",
      excerpt: "From minimalism to maximalism, discover the hottest interior design trends that are transforming homes across the country.",
      author: "David Wilson",
      date: "Jan 05, 2026",
      category: "Design",
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      slug: "interior-design-trends-2026"
    },
    {
      id: 5,
      title: "प्राइम निवास: रियल एस्टेट में आपके भरोसे का प्रतीक",
      excerpt: "प्रीमियम प्लॉट्स, रेडी-टू-मूव घर, लग्ज़री विला और रेंट सर्विसेज—प्राइम निवास के साथ सही संपत्ति का चयन अब आसान।",
      author: "Primenivaas Editorial",
      date: "Feb 12, 2026",
      category: "",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      slug: "prime-nivaas-real-estate-symbol-of-your-trust-journey-from-dream-homes-to-reality"
    },
    {
      id: 6,
      title: "How to Stage Your Home for a Quick Sale",
      excerpt: "Expert advice on staging your property to attract potential buyers and sell faster at a better price.",
      author: "Emily Davis",
      date: "Dec 28, 2025",
      category: "Sell Property Tips",
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      slug: "stage-home-quick-sale"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Insights, trends, and advice from real estate experts to help you make informed decisions.
          </p>
        </div>

        {/* Featured Post (First one) */}
        <div className="mb-16">
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl group">
            <Image 
              src={blogPosts[0].image} 
              alt={blogPosts[0].title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 sm:p-12 text-white max-w-3xl">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                {blogPosts[0].title}
              </h2>
              <p className="text-lg text-gray-200 mb-6 line-clamp-2">
                {blogPosts[0].excerpt}
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {blogPosts[0].author}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {blogPosts[0].date}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(1).map((post) => (
            <article key={post.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
              <div className="relative h-56 overflow-hidden">
                <Image 
                  src={post.image} 
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center text-xs text-gray-500 mb-3 space-x-4">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {post.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {post.date}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                  <Link href={(post.slug === 'student-housing-upes-dehradun' || post.slug === 'prime-nivaas-real-estate-symbol-of-your-trust-journey-from-dream-homes-to-reality') ? `/blog/${post.slug}` : `#`} target="_blank" rel="noopener noreferrer">
                    {post.title}
                  </Link>
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                
                <div className="pt-4 border-t border-gray-100 mt-auto">
                  <Link href={`/blog/prime-nivaas-real-estate-symbol-of-your-trust-journey-from-dream-homes-to-reality`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors">
                    Read Article <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-20 bg-blue-600 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Get the latest property news, market trends, and exclusive offers delivered directly to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                required
              />
              <button 
                type="submit" 
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg"
              >
                Subscribe
              </button>
            </form>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-[-50%] right-[-20%] w-[800px] h-[800px] rounded-full bg-white blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
