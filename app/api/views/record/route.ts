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
      const propertyDoc = await transaction.get(propertyRef);

      if (!propertyDoc.exists) return;

      const currentViewCount = propertyDoc.data()?.viewCount || 0;

      if (viewDoc.exists) {
        // Check if enough time has passed (e.g., 1 minute for testing/better UX)
        const data = viewDoc.data();
        let shouldIncrement = false;

        if (data && data.createdAt) {
          const lastViewed = data.createdAt.toDate();
          const now = new Date();
          const diffMinutes = (now.getTime() - lastViewed.getTime()) / (1000 * 60);

          // Allow increment if 1 minute has passed
          if (diffMinutes >= 1) {
            shouldIncrement = true;
          }
        } else {
          shouldIncrement = true;
        }

        // FIX: If viewCount is 0 (stuck), allow increment regardless of time
        if (currentViewCount === 0) {
          shouldIncrement = true;
        }

        if (shouldIncrement) {
          transaction.update(viewRef, {
            createdAt: FieldValue.serverTimestamp(),
          });
          transaction.update(propertyRef, {
            viewCount: FieldValue.increment(1),
          });
        }
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
