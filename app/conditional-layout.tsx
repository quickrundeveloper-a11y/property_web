'use client';

import { usePathname } from 'next/navigation';
import Header from './components/header';
import Footer from './components/footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't show header/footer on auth pages
  const isAuthPage = pathname?.startsWith('/auth');

  // Don't show header/footer on property details pages (they have their own header)
  const isPropertyDetailsPage = pathname?.startsWith('/property/');

  if (isAuthPage || isPropertyDetailsPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}