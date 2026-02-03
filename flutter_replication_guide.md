# Flutter Property App Replication Guide

This guide details the logic, data structure, and implementation steps to replicate the "Add Property" feature from the existing Next.js web application into a Flutter mobile app.

## 1. Data Model (`Property` Class)

Replicate the `Property` interface from `lib/types.ts` as a Dart class.

```dart
class Property {
  String? id;
  String? title;
  String? name;
  String? location; // From Google Places
  String? address;
  dynamic price; // num or String
  dynamic rent;
  dynamic cost;
  List<String>? images;
  String? image; // Cover image
  int? bedrooms;
  int? bathrooms;
  dynamic area; // num or String
  String? units;
  String? type; // 'sell', 'rent'
  String? propertyType; // 'residential', 'commercial', 'plot', etc.
  String? status; // 'Active', etc.
  String? priceUnit; // 'Lakh', 'Cr', 'K'
  String? description;
  String? phone;
  String? contactName;
  String? userId; // Firebase Auth UID
  String? availabilityStatus; // 'Ready to move', 'Under construction'
  String? ageOfProperty;
  String? possessionBy; // Date string
  String? ownership; // 'Freehold', etc.
  String? facing;
  List<String>? overlooking;
  List<String>? waterSource;
  String? videoUrl;
  String? floorPlan;
  List<String>? amenities;
  double? lat;
  double? lng;
  // ... add all other fields from lib/types.ts
  
  // Constructor and fromMap/toMap methods for Firestore
}
```

## 2. Dependencies (pubspec.yaml)

*   `firebase_core`, `cloud_firestore`, `firebase_auth`, `firebase_storage`: For backend services.
*   `google_maps_flutter`: For map visualization (if needed).
*   `flutter_google_places_sdk` or `google_places_flutter`: For Autocomplete logic.
*   `image_picker`: For selecting photos/videos.
*   `video_player` / `chewie`: For video previews.
*   `provider` or `flutter_bloc`: For state management (Stepper logic).
*   `geolocator`: For current location (optional).

## 3. Form Logic & Structure (Stepper)

The form is divided into 5 steps. Implement a `Stepper` widget or a custom page controller.

### Step 1: Basic Details
*   **Fields:**
    *   **I want to:** Toggle buttons (`Sell` / `Rent`).
    *   **Property Category:** Chips/Buttons (`Residential`, `Commercial`, `Land/Plot`).
    *   **Property Type:** Dynamic chips based on category (e.g., if Residential -> `Flat/Apartment`, `House/Villa`).
*   **Logic:**
    *   Selecting a category resets the property type.
    *   Selecting "Land/Plot" changes subsequent validation rules (hides bedrooms/bathrooms).

### Step 2: Location Details
*   **Fields:**
    *   **City / Location:** Text field with **Google Places Autocomplete**.
    *   **Project / Society:** Text field.
    *   **Locality / Area:** Text field.
*   **Logic:**
    *   Use `flutter_google_places_sdk` to fetch place predictions.
    *   On selection, extract `lat`, `lng`, and `formatted_address`.
    *   Auto-fill the location text field.

### Step 3: Property Features
*   **Fields (Dynamic):**
    *   **Bedrooms:** Number selector (1, 2, 3, 4, 5+). *Hidden for Plots.*
    *   **Bathrooms:** Number selector. *Hidden for Plots.*
    *   **Balconies:** Number selector. *Hidden for Plots.*
    *   **Floor No / Total Floors:** Dropdowns/Text fields.
    *   **Furnished Status:** Chips (`Furnished`, `Semi-Furnished`, `Unfurnished`).
    *   **Covered/Open Parking:** Number selectors.
    *   **Area Details:**
        *   `Carpet Area` / `Super Area` / `Plot Area` (depending on type).
        *   `Unit` dropdown (Sq-ft, Sq-yrd, etc.).
    *   **Willing to rent out to:** (Only if `type == 'rent'`) Multi-select chips (`Family`, `Single men`, etc.).
    *   **Availability:** Chips (`Ready to move`, `Under construction`).
        *   If `Ready to move` -> Show `Age of Property`.
        *   If `Under construction` -> Show `Possession By` date picker.
    *   **Description:** Multi-line text area.

### Step 4: Photos & Media
*   **Fields:**
    *   **Photos:** Multi-image picker. Drag-and-drop UI (on web) or Grid UI (on mobile).
        *   **Cover Image:** Allow user to tap an image to set it as "Main/Cover".
    *   **Video:** Single video picker.
    *   **Floor Plan:** Single image picker.
*   **Logic:**
    *   Store local file paths in state.
    *   Upload to Firebase Storage only on final submission (or progressively).
    *   Show thumbnails with "Remove" buttons.

### Step 5: Pricing & Amenities
*   **Fields:**
    *   **Ownership:** Chips (`Freehold`, `Leasehold`, etc.).
    *   **Price / Expected Rent:** Numeric input.
    *   **Price Unit:** Dropdown (`Lakh`, `Cr`, `Thousand`).
    *   **Price per sq.ft:** Auto-calculated (Display only).
    *   **Additional Charges:** Checkboxes (`Tax Excluded`, `Price Negotiable`, etc.).
    *   **Amenities:** Multi-select grid (e.g., `Lift`, `Gym`, `Pool`, `Security`).
    *   **Additional Features:**
        *   `Facing`: Dropdown (`East`, `West`, etc.).
        *   `Overlooking`: Multi-select (`Park`, `Main Road`).
        *   `Water Source`: Multi-select.

## 4. Submission Logic (Firebase)

1.  **Validation:** Ensure all required fields (marked with `*` in UI) are filled before enabling the "Post Property" button.
2.  **Image Upload:**
    *   Iterate through selected image files.
    *   Upload each to `property-images/{timestamp}_{filename}`.
    *   Get download URLs.
3.  **Video/FloorPlan Upload:**
    *   Upload to `property-videos/` or `property-floorplans/`.
    *   Get download URLs.
4.  **Firestore Document:**
    *   Collection: `property_All/main/properties` (or your specific path).
    *   Create a Map<String, dynamic> matching the `Property` model.
    *   Add metadata: `createdAt: FieldValue.serverTimestamp()`, `status: 'Active'`.
    *   `set()` or `add()` the document.
5.  **User Profile Update (Optional):**
    *   If the user's phone number is collected in the form (or if it's missing from profile), update `property_All/main/users/{uid}`.

## 5. Key UI/UX Components

*   **Progress Bar:** Top indicator showing Step 1/5 to Step 5/5.
*   **Navigation:** "Back" and "Next" buttons. "Next" should be disabled if current step is invalid.
*   **Selection Chips:** Use `ChoiceChip` or `FilterChip` for single/multi-select options.
*   **Autocomplete:** Use a `TypeAheadField` or similar for Google Places.

## 6. Security Rules (Firestore)

Ensure your Firestore rules allow:
*   **Read:** Public (or authenticated only, depending on app logic).
*   **Write:** Authenticated users (`request.auth != null`).
*   **Update/Delete:** Only the owner (`request.auth.uid == resource.data.userId`).

## 7. Comparison with Web Code

*   **Web:** Uses `useRef` for Google Maps API.
*   **Flutter:** Use `flutter_google_places_sdk` plugin; no direct JS API calls.
*   **Web:** Uses standard HTML `<input type="file">`.
*   **Flutter:** Use `image_picker` package.
*   **Web:** `router.push('/home')` on success.
*   **Flutter:** `Navigator.pop(context)` or `Navigator.pushReplacementNamed(...)`.
