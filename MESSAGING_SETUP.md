# Messaging System Setup

## Firebase Collections

### Messages Collection (`messages`)
Each message document contains:
```javascript
{
  id: "auto-generated",
  text: "Message content",
  sender: "user" | "admin",
  phoneNumber: "+91XXXXXXXXXX",
  userName: "User Name",
  timestamp: serverTimestamp()
}
```

## Features Implemented

### 1. Floating Chat Widget
- **Location**: Available on all pages via layout.tsx
- **Features**:
  - User registration with name and phone
  - Real-time messaging
  - Message history
  - Professional UI design

### 2. Admin Message Management
- **URL**: `/admin/messages`
- **Features**:
  - View all conversations
  - Real-time message updates
  - Reply to customer messages
  - Conversation management
  - Unread message indicators

## How to Use

### For Customers:
1. Click the blue chat icon (bottom-right corner)
2. Enter name and phone number
3. Start chatting with support

### For Admins:
1. Go to `/admin/messages`
2. Select a conversation from the sidebar
3. View message history
4. Reply to customer messages
5. All messages are saved in Firebase

## Firebase Security Rules

Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Messages collection
    match /messages/{messageId} {
      allow read, write: if true; // Adjust based on your auth requirements
    }
  }
}
```

## Technical Details

- **Real-time Updates**: Uses Firebase onSnapshot for live messaging
- **Data Persistence**: All messages stored in Firestore
- **Responsive Design**: Works on mobile and desktop
- **Error Handling**: Proper loading states and error management
- **Phone Validation**: Basic phone number format validation

## File Structure

```
app/
├── components/
│   └── messaging-widget.tsx     # Floating chat widget
├── admin/
│   └── messages/
│       └── page.tsx            # Admin message management
└── layout.tsx                  # Widget integration
```

## Next Steps

1. Add authentication for admin access
2. Implement phone number verification
3. Add file/image sharing
4. Add message search functionality
5. Add notification system