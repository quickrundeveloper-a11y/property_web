# Firebase Collections Setup for Messaging System

## Required Collections

### 1. `messages` Collection ⭐ UPDATED
```
Collection ID: messages
```

**Document Structure:**
```json
{
  "id": "auto-generated-id",
  "text": "Message content",
  "senderId": "user-uid",
  "senderEmail": "user@example.com", 
  "senderName": "User Display Name",
  "userId": "user-uid",
  "timestamp": "firestore-timestamp",
  "isSupport": false,
  "isRead": false
}
```

### 2. `conversations` Collection (Optional - for better organization)
```
Collection ID: conversations
```

**Document Structure:**
```json
{
  "id": "user-uid",
  "userEmail": "user@example.com",
  "userName": "User Name",
  "lastMessage": "Last message text",
  "lastMessageTime": "firestore-timestamp",
  "unreadCount": 0,
  "status": "active",
  "createdAt": "firestore-timestamp"
}
```

## Firebase Security Rules

Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Messages Collection (Updated from supportMessages)
    match /messages/{document} {
      // Users can read and write their own messages
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.email.matches('.*admin.*'));
    }
    
    // Conversations Collection  
    match /conversations/{document} {
      // Users can read their own conversations, admins can read all
      allow read, write: if request.auth != null && 
        (resource.data.id == request.auth.uid || 
         request.auth.token.email.matches('.*admin.*'));
    }
  }
}
```

## Setup Instructions

1. **Go to Firebase Console**
2. **Select your project**
3. **Go to Firestore Database**
4. **Create Collections manually or they will be created automatically when first message is sent**
5. **Update Security Rules** with the rules above
6. **Test the messaging system**

## Collection will be created automatically when:
- First user sends a message
- Admin replies to a message
- System initializes conversations

No manual collection creation needed - Firebase will handle it automatically!

## Key Features Implemented:

✅ **Right-side messaging widget** - Fixed position on right side of website
✅ **Real-time messaging** - Live updates using Firebase onSnapshot
✅ **Admin panel** - Full admin dashboard at `/admin/messages`
✅ **User messages page** - Dedicated page at `/messages`
✅ **Unread message badges** - Shows unread count on widget icon
✅ **Dynamic collections** - Auto-creates "messages" collection
✅ **Client-admin communication** - Two-way messaging system