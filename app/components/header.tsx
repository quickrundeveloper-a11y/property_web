'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManagePropertyOpen, setIsManagePropertyOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  const getUserInitial = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/home" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">🏠</span>
              </div>
              <span className="text-white font-bold text-xl">Hommie</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/rent" className="text-white hover:text-blue-100 transition-colors">
              Rent
            </Link>
            <Link href="/buy" className="text-white hover:text-blue-100 transition-colors">
              Buy
            </Link>
            <Link href="/sell" className="text-white hover:text-blue-100 transition-colors">
              Sell
            </Link>
            
            {/* Manage Property Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsManagePropertyOpen(!isManagePropertyOpen)}
                className="text-white hover:text-blue-100 transition-colors flex items-center space-x-1"
              >
                <span>Manage Property</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isManagePropertyOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                  <Link href="/manage/dashboard" className="block px-4 py-2 text-gray-800 hover:bg-blue-50">
                    Dashboard
                  </Link>
                  <Link href="/manage/properties" className="block px-4 py-2 text-gray-800 hover:bg-blue-50">
                    My Favourite Property
                  </Link>
                  <Link href="/manage/tenants" className="block px-4 py-2 text-gray-800 hover:bg-blue-50">
                    Tenants
                  </Link>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                className="text-white hover:text-blue-100 transition-colors flex items-center space-x-1"
              >
                <span>Resources</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isResourcesOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                  <Link href="/resources/guides" className="block px-4 py-2 text-gray-800 hover:bg-blue-50">
                    Guides
                  </Link>
                  <Link href="/resources/calculator" className="block px-4 py-2 text-gray-800 hover:bg-blue-50">
                    Calculator
                  </Link>
                  <Link href="/resources/blog" className="block px-4 py-2 text-gray-800 hover:bg-blue-50">
                    Blog
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 animate-pulse bg-white/20 rounded-full"></div>
            ) : user ? (
              /* User Avatar Dropdown */
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-semibold hover:bg-blue-50 transition-colors"
                >
                  {getUserInitial(user.email || 'U')}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm text-gray-600">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-gray-800 hover:bg-blue-50">
                      Profile
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-gray-800 hover:bg-blue-50">
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Login/Signup Buttons */
              <>
                <Link
                  href="/auth?mode=login"
                  className="text-white border border-white px-4 py-2 rounded-md hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-blue-100 focus:outline-none focus:text-blue-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-blue-500 rounded-lg mt-2">
              <Link
                href="/rent"
                className="text-white hover:text-blue-100 block px-3 py-2 rounded-md text-base font-medium"
              >
                Rent
              </Link>
              <Link
                href="/buy"
                className="text-white hover:text-blue-100 block px-3 py-2 rounded-md text-base font-medium"
              >
                Buy
              </Link>
              <Link
                href="/sell"
                className="text-white hover:text-blue-100 block px-3 py-2 rounded-md text-base font-medium"
              >
                Sell
              </Link>
              
              {/* Mobile Manage Property */}
              <div className="px-3 py-2">
                <button
                  onClick={() => setIsManagePropertyOpen(!isManagePropertyOpen)}
                  className="text-white hover:text-blue-100 flex items-center justify-between w-full text-base font-medium"
                >
                  <span>Manage Property</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isManagePropertyOpen && (
                  <div className="mt-2 space-y-1 pl-4">
                    <Link href="/manage/dashboard" className="text-blue-100 block py-1">
                      Dashboard
                    </Link>
                    <Link href="/manage/properties" className="text-blue-100 block py-1">
                      My Favourite Property
                    </Link>
                    <Link href="/manage/tenants" className="text-blue-100 block py-1">
                      Tenants
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Resources */}
              <div className="px-3 py-2">
                <button
                  onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                  className="text-white hover:text-blue-100 flex items-center justify-between w-full text-base font-medium"
                >
                  <span>Resources</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isResourcesOpen && (
                  <div className="mt-2 space-y-1 pl-4">
                    <Link href="/resources/guides" className="text-blue-100 block py-1">
                      Guides
                    </Link>
                    <Link href="/resources/calculator" className="text-blue-100 block py-1">
                      Calculator
                    </Link>
                    <Link href="/resources/blog" className="text-blue-100 block py-1">
                      Blog
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Auth Section */}
              <div className="px-3 py-2 space-y-2">
                {loading ? (
                  <div className="w-8 h-8 animate-pulse bg-white/20 rounded-full mx-auto"></div>
                ) : user ? (
                  <>
                    <div className="flex items-center space-x-3 px-3 py-2 bg-blue-600 rounded-md">
                      <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        {getUserInitial(user.email || 'U')}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">Signed in as</p>
                        <p className="text-blue-100 text-xs truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      className="text-white block text-center px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="text-white block text-center px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-white block w-full text-center px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth?mode=login"
                      className="text-white border border-white block text-center px-4 py-2 rounded-md hover:bg-white hover:text-blue-600 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth?mode=signup"
                      className="bg-blue-700 text-white block text-center px-4 py-2 rounded-md hover:bg-blue-800 transition-colors"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
