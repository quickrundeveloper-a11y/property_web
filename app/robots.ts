import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.primenivaas.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/manage/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
