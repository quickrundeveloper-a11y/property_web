import { adminDb, FieldValue } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { propertyId, userId, isGuest } = await request.json();

    if (!propertyId || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const viewDocId = `${propertyId}_${userId}`;
    const viewRef = adminDb.collection('property_views').doc(viewDocId);
    // Use the correct path consistent with the frontend: property_All/main/properties
    const propertyRef = adminDb.collection('property_All').doc('main').collection('properties').doc(propertyId);

    await adminDb.runTransaction(async (transaction) => {
      const viewDoc = await transaction.get(viewRef);

      if (viewDoc.exists) {
        if (isGuest) {
          // Check if 24 hours have passed
          const data = viewDoc.data();
          if (data && data.createdAt) {
            const lastViewed = data.createdAt.toDate();
            const now = new Date();
            const diffHours = (now.getTime() - lastViewed.getTime()) / (1000 * 60 * 60);

            if (diffHours >= 24) {
              transaction.update(viewRef, {
                createdAt: FieldValue.serverTimestamp(),
              });
              transaction.update(propertyRef, {
                viewCount: FieldValue.increment(1),
              });
            }
          }
        }
        // Logged-in users: Do nothing (count only once)
      } else {
        // New view
        transaction.set(viewRef, {
          propertyId,
          userId,
          isGuest,
          createdAt: FieldValue.serverTimestamp(),
          platform: 'web-nextjs',
        });
        
        transaction.update(propertyRef, {
          viewCount: FieldValue.increment(1),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('View record error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
