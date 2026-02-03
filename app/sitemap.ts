import { MetadataRoute } from 'next';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.primenivaas.com';

  // Static routes
  const routes = [
    '',
    '/home',
    '/home?filter=Buy',
    '/home?filter=Rent',
    '/home?filter=Commercial',
    '/add-property',
    '/company',
    '/contact',
    '/terms',
    '/privacy',
    '/trust-safety',
    '/blog',
    '/guides',
    '/faq',
    '/help',
    '/auth',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic property routes
  let propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    // Fetch latest properties
    const q = query(
      collection(db, 'property_All', 'main', 'properties'),
      limit(1000)
    );
    const snapshot = await getDocs(q);
    
    propertyRoutes = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Use updatedAt if available, else createdAt, else now
      // Handle Firestore timestamps safely
      let lastMod = new Date();
      if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
        lastMod = data.updatedAt.toDate();
      } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        lastMod = data.createdAt.toDate();
      }
      
      return {
        url: `${baseUrl}/property/${doc.id}`,
        lastModified: lastMod,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      };
    });
  } catch (error) {
    console.error('Error generating property sitemap:', error);
  }

  return [...routes, ...propertyRoutes];
}
