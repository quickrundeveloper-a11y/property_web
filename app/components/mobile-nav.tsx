"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Search, PlusCircle, User } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Favourite", href: "/favorites", icon: Heart },
    { name: "Search", href: "/home#search", icon: Search },
    { name: "Add", href: "/add-property", icon: PlusCircle },
    { name: "User", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-[#0066FF]" : "text-gray-500 hover:text-[#0066FF]"
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
