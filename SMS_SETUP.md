# SMS Functionality Setup

## Overview
The SMS functionality allows users to send inquiry messages about properties through a minimal modal interface with just message preview and custom message options.

## Recent Updates
**Further Simplified SMS Modal**: Removed message type selection section to create the most streamlined messaging experience possible.

## Implementation Details

### SMS Button Behavior
- **Minimal Modal Interface**: When users click the SMS button, a simple modal opens
- **Fixed Message Type**: All messages are inquiry-type messages
- **Custom Messages**: Users can write custom messages or use the preset template
- **SMS App Integration**: Opens device SMS app with pre-filled message
- **Firebase Storage**: All messages are saved to Firebase for admin tracking

### Message Template
All SMS messages use a single inquiry template:
```
Hi! I'm interested in [Property Name] located at [Location] priced at ₹[Price]/month. Could you please provide more details about this property?
```

### Firebase Collection Structure
Messages are saved to the `sms` collection with the following fields:
- `message`: The inquiry text
- `phoneNumber`: Property owner's phone number
- `propertyId`: Unique property identifier
- `propertyName`: Property title/name
- `propertyLocation`: Property location/address
- `propertyPrice`: Property price/rent amount
- `messageType`: Always set to 'inquiry'
- `timestamp`: Server timestamp
- `status`: Set to 'sent'
- `type`: Set to 'sms'
- `isRead`: Set to false

### Files Modified
1. **`app/home/page.tsx`**:
   - SMS modal state variables (smsModalOpen, selectedProperty)
   - handleSMSClick function
   - SMS modal JSX component
   - SMS modal import
   - SMS buttons open modal interface

2. **`app/components/sms-modal.tsx`**:
   - **ULTRA SIMPLIFIED**: Removed message type selection
   - **MINIMAL UI**: Only message preview and custom message option
   - Single inquiry message template
   - SMS app integration
   - Firebase storage

## User Experience Flow
1. User browses properties on the home page
2. Clicks the green SMS icon on any property card
3. SMS modal opens with property details
4. Reviews auto-generated inquiry message or writes custom message
5. Clicks "Send SMS" button
6. Message is saved to Firebase
7. Device SMS app opens with pre-filled message
8. User can send the SMS directly from their device

## Modal Contents
The SMS modal now contains only:
- Property information display
- Message preview (auto-generated inquiry)
- Custom message textarea (optional)
- Send/Cancel buttons

## Admin Access
All messages are stored in Firebase and can be viewed through:
- Admin panel at `/admin/messages`
- Firebase console under the `sms` collection

## Development Server
The application is running on `http://localhost:3000` with ultra-simplified SMS modal functionality working as requested.