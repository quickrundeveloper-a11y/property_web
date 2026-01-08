# Floating SMS Widget & Messages Management

## Overview
Added a floating SMS widget on the right side of the website and a Firebase messages management system.

## Features Implemented

### 1. Floating SMS Widget
- **Location**: Right side of the website (fixed position)
- **Design**: Green circular button with SMS icon
- **Functionality**: 
  - Click to open message form
  - User can enter name, phone, and message
  - Saves to Firebase 'messages' collection
  - Form validation and loading states
  - Success/error feedback

### 2. Firebase Messages Collection
- **Collection Name**: `messages`
- **Document Structure**:
  ```javascript
  {
    id: "unique_id",
    name: "User Name",
    phone: "+91-9876543210", 
    message: "User message content",
    timestamp: serverTimestamp(),
    status: "unread", // or "read"
    type: "inquiry",
    source: "website_widget"
  }
  ```

### 3. Admin Messages Management
- **URL**: `/admin/messages`
- **Features**:
  - Real-time message updates
  - Filter by status (All, Unread, Read)
  - Mark messages as read/unread
  - Delete messages
  - Call customer directly (tel: link)
  - Message count display
  - Responsive design

## Files Created/Modified

### New Files:
1. **`app/components/floating-sms-widget.tsx`**:
   - Floating SMS button and form modal
   - Firebase integration for saving messages
   - Form validation and user feedback

2. **`app/admin/messages/page.tsx`**:
   - Admin interface for managing messages
   - Real-time updates using onSnapshot
   - CRUD operations for messages

### Modified Files:
1. **`app/home/page.tsx`**:
   - Added FloatingSMSWidget import and component
   - Cleaned up old SMS modal code

## Usage Instructions

### For Users:
1. Visit any page on the website
2. Look for green SMS icon on bottom-right corner
3. Click to open message form
4. Fill in name, phone, and message
5. Click "Send" to submit

### For Admins:
1. Go to `/admin/messages`
2. View all customer messages
3. Filter by read/unread status
4. Mark messages as read when handled
5. Call customers directly using phone links
6. Delete messages when no longer needed

## Technical Details

### Widget Positioning:
- Fixed position: `bottom-6 right-6`
- Z-index: 50 (appears above other content)
- Responsive design for mobile/desktop

### Firebase Integration:
- Uses Firestore for real-time data
- Automatic timestamp generation
- Status tracking for message management
- Real-time updates in admin panel

### Styling:
- Tailwind CSS for consistent design
- Green theme matching SMS/messaging
- Hover effects and transitions
- Mobile-friendly responsive design

## Development Server
The application is running on `http://localhost:3000` with the floating SMS widget active on all pages and admin messages management available at `/admin/messages`.