'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/app/context/ChatContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
  
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManagePropertyOpen, setIsManagePropertyOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileUserOpen, setIsMobileUserOpen] = useState(false);
  const [isMobileManagePropertyOpen, setIsMobileManagePropertyOpen] = useState(false);
  const [isMobileResourcesOpen, setIsMobileResourcesOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const { openChat } = useChat();
  const [profileName, setProfileName] = useState<string | null>(null);

  const managePropertyRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (managePropertyRef.current && !managePropertyRef.current.contains(event.target as Node)) {
        setIsManagePropertyOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setIsResourcesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    const loadName = async () => {
      if (!user?.uid) return;
      if (user.displayName && user.displayName.trim()) {
        setProfileName(user.displayName);
        return;
      }
      try {
        const ref = doc(db, 'property_All', 'main', 'users', user.uid);
        const snap = await getDoc(ref);
        const dn = snap.exists() ? (snap.data()?.displayName as string | undefined) : undefined;
        if (dn && dn.trim()) setProfileName(dn);
      } catch {}
    };
    loadName();
  }, [user?.uid, user?.displayName]);
  
  useEffect(() => {
    const onOpenChat = () => {
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
      setIsManagePropertyOpen(false);
      setIsResourcesOpen(false);
      setIsMobileUserOpen(false);
      setIsMobileManagePropertyOpen(false);
      setIsMobileResourcesOpen(false);
    };
    window.addEventListener("open-chat", onOpenChat as EventListener);
    return () => {
      window.removeEventListener("open-chat", onOpenChat as EventListener);
    };
  }, []);

  const getUserInitial = () => {
    const name = (profileName || user?.displayName || "").trim();
    if (name) return name.charAt(0).toUpperCase();
    const email = user?.email || "";
    const match = email.match(/[A-Za-z]/);
    return match ? match[0].toUpperCase() : "U";
  };

  return (
    <header className="bg-[#57a8ff] shadow-lg border-b border-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/home" className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">🏠</span>
              </div>
              <span className="text-white font-bold text-xl">Prime Nivaas</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/home?filter=Rent" className="text-white hover:text-blue-100 transition-colors">
              Rent
            </Link>
            <Link href="/home?filter=Buy" className="text-white hover:text-blue-100 transition-colors">
              Buy
            </Link>
            <Link href="/home?filter=Sell" className="text-white hover:text-blue-100 transition-colors">
              Post Property
            </Link>
            
            {/* Manage Property Dropdown */}
            <div className="relative" ref={managePropertyRef}>
              <button
                onClick={() => {
                  setIsManagePropertyOpen(!isManagePropertyOpen);
                  setIsResourcesOpen(false);
                  setIsUserMenuOpen(false);
                }}
                className="text-white hover:text-blue-100 transition-colors flex items-center space-x-1"
              >
                <span>Manage Property</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isManagePropertyOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                  <Link href="/manage/dashboard" className="block px-4 py-2 text-gray-800 hover:bg-blue-50" onClick={() => setIsManagePropertyOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/manage/properties" className="block px-4 py-2 text-gray-800 hover:bg-blue-50" onClick={() => setIsManagePropertyOpen(false)}>
                    My Favourite Property
                  </Link>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div className="relative" ref={resourcesRef}>
              <button
                onClick={() => {
                  setIsResourcesOpen(!isResourcesOpen);
                  setIsManagePropertyOpen(false);
                  setIsUserMenuOpen(false);
                }}
                className="text-white hover:text-blue-100 transition-colors flex items-center space-x-1"
              >
                <span>Location</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isResourcesOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                  <Link href="/property?location=Noida" className="block px-4 py-2 text-gray-800 hover:bg-blue-50" onClick={() => setIsResourcesOpen(false)}>
                    Noida
                  </Link>
                  <Link href="/property?location=Goa" className="block px-4 py-2 text-gray-800 hover:bg-blue-50" onClick={() => setIsResourcesOpen(false)}>
                    Goa
                  </Link>
                  <Link href="/property?location=Dehradun" className="block px-4 py-2 text-gray-800 hover:bg-blue-50" onClick={() => setIsResourcesOpen(false)}>
                    Dehradun
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 animate-pulse bg-white/20 rounded-full"></div>
            ) : user && !user.isAnonymous ? (
              /* User Avatar Dropdown */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsManagePropertyOpen(false);
                    setIsResourcesOpen(false);
                  }}
                  className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-semibold hover:bg-blue-50 transition-colors"
                >
                  {getUserInitial()}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-md shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm text-gray-600">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 break-words">{user.email}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-gray-800 hover:bg-blue-50" onClick={() => setIsUserMenuOpen(false)}>
                      Profile
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
                  className="bg-[#0085FF] text-white px-4 py-2 rounded-md hover:bg-[#006ACC] transition-colors"
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
                href="/home?filter=Rent"
                className="text-white hover:text-blue-100 block px-3 py-2 rounded-md text-base font-medium"
              >
                Rent
              </Link>
              <Link
                href="/home?filter=Buy"
                className="text-white hover:text-blue-100 block px-3 py-2 rounded-md text-base font-medium"
              >
                Buy
              </Link>
              <Link
                href="/home?filter=Sell"
                className="text-white hover:text-blue-100 block px-3 py-2 rounded-md text-base font-medium"
              >
                Post Property
              </Link>
              <button
                onClick={() => {
                  openChat();
                  setIsMenuOpen(false);
                }}
                className="text-white hover:text-blue-100 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                Messages
              </button>
              
              {/* Mobile Manage Property */}
              <div className="px-3 py-2">
                <button
                  onClick={() => {
                    setIsMobileManagePropertyOpen(!isMobileManagePropertyOpen);
                    setIsMobileResourcesOpen(false);
                  }}
                  className="text-white hover:text-blue-100 flex items-center justify-between w-full text-base font-medium"
                >
                  <span>Manage Property</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isMobileManagePropertyOpen && (
                  <div className="mt-2 space-y-1 pl-4">
                    <Link href="/manage/dashboard" className="text-blue-100 block py-1" onClick={() => setIsMenuOpen(false)}>
                      Dashboard
                    </Link>
                    <Link href="/manage/properties" className="text-blue-100 block py-1" onClick={() => setIsMenuOpen(false)}>
                      My Favourite Property
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Resources */}
              <div className="px-3 py-2">
                <button
                  onClick={() => {
                    setIsMobileResourcesOpen(!isMobileResourcesOpen);
                    setIsMobileManagePropertyOpen(false);
                  }}
                  className="text-white hover:text-blue-100 flex items-center justify-between w-full text-base font-medium"
                >
                  <span>Location</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isMobileResourcesOpen && (
                  <div className="mt-2 space-y-1 pl-4">
                    <Link href="/property?location=Noida" className="text-blue-100 block py-1" onClick={() => setIsMenuOpen(false)}>
                      Noida
                    </Link>
                    <Link href="/property?location=Goa" className="text-blue-100 block py-1" onClick={() => setIsMenuOpen(false)}>
                      Goa
                    </Link>
                    <Link href="/property?location=Dehradun" className="text-blue-100 block py-1" onClick={() => setIsMenuOpen(false)}>
                      Dehradun
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Auth Section */}
              <div className="px-3 py-2 space-y-2">
                {loading ? (
                  <div className="w-8 h-8 animate-pulse bg-white/20 rounded-full mx-auto"></div>
                ) : user && !user.isAnonymous ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsMobileUserOpen(!isMobileUserOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 bg-blue-600 rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {getUserInitial()}
                        </div>
                        <div className="text-left">
                          <p className="text-white text-sm font-medium">Signed in as</p>
                          <p className="text-blue-100 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                      <svg className={`w-4 h-4 text-white ${isMobileUserOpen ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isMobileUserOpen && (
                      <>
                        <Link
                          href="/profile"
                          className="text-white block text-center px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsMobileUserOpen(false);
                          }}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="text-white block w-full text-center px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Sign out
                        </button>
                      </>
                    )}
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
                      className="bg-[#0085FF] text-white block text-center px-4 py-2 rounded-md hover:bg-[#006ACC] transition-colors"
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
