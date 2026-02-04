"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  // Generate Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.href ? `https://www.primenivaas.com${item.href}` : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className={`flex items-center text-sm text-slate-500 mb-6 ${className}`}>
        <ol className="flex items-center flex-wrap gap-2">
          {/* Home Icon */}
          <li className="flex items-center">
            <Link 
              href="/home" 
              className="hover:text-[#0085FF] transition-colors flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={index} className="flex items-center">
                <ChevronRight className="w-4 h-4 text-slate-400 mx-1 flex-shrink-0" />
                {item.href && !isLast ? (
                  <Link 
                    href={item.href}
                    className="hover:text-[#0085FF] transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={`whitespace-nowrap ${isLast ? "font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs" : ""}`}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
