import Link from 'next/link';

export default function Sitemap() {
  const sections = [
    {
      title: "Main",
      links: [
        { name: "Home", href: "/" },
        { name: "Add Property", href: "/add-property" },
        { name: "Manage Properties", href: "/manage/properties" },
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/company" },
        { name: "Contact", href: "/contact" },
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Terms & Conditions", href: "/terms" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Trust & Safety", href: "/trust-safety" },
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Blog", href: "/blog" },
        { name: "Guides", href: "/guides" },
        { name: "FAQ", href: "/faq" },
        { name: "Help Center", href: "/help" },
      ]
    },
    {
      title: "User",
      links: [
        { name: "Profile", href: "/profile" },
        { name: "Login / Register", href: "/auth" },
      ]
    }
  ];

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Sitemap</h1>
          <p className="mt-4 text-lg text-gray-500">
            Overview of the pages on our website.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section) => (
            <div key={section.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">{section.title}</h2>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all inline-block flex items-center"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
