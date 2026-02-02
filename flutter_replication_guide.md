# Flutter App Replication Guide: Add Property Feature

This guide documents the logic, structure, and database schema of the "Add Property" feature from the Next.js web application to facilitate replication in a Flutter app.

## 1. Overview
The "Add Property" feature is a multi-step wizard that allows users to list properties for sale or rent. It handles data collection, validation, media uploads (images/video), and saves the final data to a Firestore database.

## 2. Architecture & State Management

### 2.1. Core State (`formData`)
The app maintains a central state object that accumulates data across all steps.

**Initial State:**
```dart
// Flutter equivalent model
class PropertyFormData {
  String type = 'sell'; // 'sell' | 'rent' | 'pg'
  String propertyType = 'Residential'; // 'Residential' | 'Commercial' | 'Land/Plot'
  String propertyCategory = 'Flat/Apartment'; // Dynamic based on propertyType
  
  // Location
  String location = ''; // Full address string
  String city = '';
  String locality = '';
  String subLocality = '';
  String landmark = '';
  double? lat;
  double? lng;
  
  // Property Details
  String title = ''; // Generated or user input
  String description = '';
  String uniqueDescription = '';
  
  // Specs
  int bedrooms = 1;
  int bathrooms = 1;
  int balconies = 0;
  String area = '';
  String units = 'sq.ft'; // Default unit
  String furnishingStatus = 'Unfurnished';
  String possessionStatus = 'Ready to Move';
  String floorNo = '';
  String totalFloors = '';
  
  // Pricing
  double price = 0;
  String priceUnit = 'Lakh'; // 'Crore' | 'Lakh' | 'Thousand'
  bool allInclusivePrice = false;
  bool taxExcluded = false;
  bool priceNegotiable = false;
  
  // Media
  List<File> images = []; // Local files before upload
  List<String> imageUrls = []; // URLs after upload
  File? video;
  
  // Contact
  String ownerName = '';
  String email = '';
  String phone = '';
  String userType = 'Owner'; // 'Owner' | 'Agent' | 'Builder'
  
  // Arrays
  List<String> features = []; // Amenities
}
```

### 2.2. Stepper Logic
The form is divided into 5 steps. Navigation is controlled by a `currentStep` index (0-4).
*   **Validation**: Each step must be validated before proceeding to the next.
*   **Progress**: A progress bar or stepper UI indicates the current stage.

## 3. Step-by-Step Implementation Details

### Step 1: Basic Information
**Fields:**
*   **I want to:** Toggle buttons [Sell, Rent, PG].
*   **Property Type:** Dropdown/Cards [Residential, Commercial, Land/Plot].
*   **Property Category:** Dynamic dropdown based on 'Property Type'.
    *   *Residential*: Flat/Apartment, Independent House/Villa, Independent/Builder Floor, Serviced Apartment, 1RK/Studio Apartment, Farmhouse.
    *   *Commercial*: Office, Retail Shop, Showroom, Warehouse/Godown, Industrial Building, Industrial Shed, Co-working Space.
    *   *Land/Plot*: Residential Land/Plot, Commercial Land/Plot, Industrial Land/Plot, Agricultural Land, Farm Land.

**Logic:**
*   Reset `propertyCategory` when `propertyType` changes.
*   Auto-select first category.

### Step 2: Location Details
**Fields:**
*   **City:** Text Input.
*   **Locality:** Text Input.
*   **Sub-Locality:** Text Input (Optional).
*   **Address/Landmark:** Text Input.
*   **Map Integration:**
    *   Display Google Maps/OpenStreetMap.
    *   Allow user to drag a marker to pinpoint exact location.
    *   Reverse geocoding (optional) to auto-fill address fields based on pin drop.
    *   **Store:** `lat` and `lng`.

**Validation:** City and Locality are mandatory.

### Step 3: Property Features & Amenities
*Conditional UI:* If `propertyType` is "Land/Plot", hide Bedroom/Bathroom/Furnishing fields.

**Fields:**
*   **Area:** Number Input + Unit Dropdown.
    *   *Units:* sq.ft, sq.yards, sq.m, acres, marla, cents, bigha, kottah, kanal, grounds, ares, biswa, guntha, aankadam, hectares, rood, chataks, perch.
*   **Bedrooms:** Counter/Chip selection (1, 2, 3, 4, 5+).
*   **Bathrooms:** Counter/Chip selection.
*   **Balconies:** Counter/Chip selection.
*   **Furnishing Status:** [Furnished, Semi-Furnished, Unfurnished].
*   **Floors:** Two inputs (Property on Floor X of Total Floors Y).
*   **Age of Property:** [New Construction, 0-1 years, 1-5 years, 5-10 years, 10+ years].
*   **Amenities:** Multi-select grid (e.g., Parking, Lift, Power Backup, Gym, Pool, Security, Clubhouse).

**Logic:**
*   Maintain a list of selected amenities strings in `formData.features`.

### Step 4: Media Upload
**Fields:**
*   **Photos:** Multi-image picker.
    *   Allow reordering (drag & drop).
    *   Mark one as "Cover Image".
    *   Delete option.
*   **Video:** Single video picker.

**Implementation Note:**
*   Upload files to Firebase Storage (or equivalent).
*   Get download URLs.
*   **Critical:** Do not upload immediately on selection? Or upload and store temp URLs? *Recommendation: Upload on final submit or background upload with progress indicators.*

### Step 5: Pricing & Additional Details
**Fields:**
*   **Ownership Type:** [Freehold, Leasehold, Co-operative Society, Power of Attorney].
*   **Price:** Number Input.
*   **Price Unit:** [Crore, Lakh, Thousand].
*   **Checkboxes:** All Inclusive Price, Tax Excluded, Price Negotiable.
*   **Description:** Text Area (Auto-generated suggestion button based on selected features).
*   **Contact Info:** Name, Phone, Email (Pre-filled from User Profile if available).

## 4. Database Schema (Firestore)

**Collection:** `properties`

**Document Structure:**
```json
{
  "title": "String (e.g., '2 BHK Flat in Andheri West')",
  "location": "String (Combined address)",
  "lat": "Number (Geopoint Latitude)",
  "lng": "Number (Geopoint Longitude)",
  "price": "Number (Raw numeric value)",
  "priceUnit": "String ('Lakh' | 'Crore')",
  "allInclusivePrice": "Boolean",
  "taxExcluded": "Boolean",
  "priceNegotiable": "Boolean",
  "ownership": "String",
  
  "description": "String (Full description)",
  "uniqueDescription": "String (Short summary/catchy phrase)",
  
  "bedrooms": "Number",
  "bathrooms": "Number",
  "balconies": "Number",
  
  "area": "String (Numeric string)",
  "units": "String (Unit type)",
  
  "features": ["Array of Strings (Amenities)"],
  
  "images": ["Array of Strings (URLs)"],
  "video": "String (URL) | null",
  
  "type": "String ('sell' | 'rent')",
  "propertyType": "String",
  "propertyCategory": "String",
  
  "OwnerName": "String",
  "phone": "String",
  "email": "String",
  "sellerId": "String (Reference to User ID)",
  "userType": "String",
  
  "status": "String ('active' | 'pending' | 'sold')",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## 5. Key Business Logic Rules
1.  **Conditional Validation:**
    *   If `propertyType` == 'Land/Plot', do not validate bedrooms/bathrooms.
    *   Price must be greater than 0.
    *   Phone number must be valid (10 digits).
2.  **Title Generation:**
    *   Frontend often auto-generates a default title like "{BHK} {Category} for {Type} in {Locality}" if the user doesn't provide one.
3.  **Data Formatting:**
    *   Ensure numeric fields (price, lat, lng) are stored as Numbers, not Strings, for querying/sorting.

## 6. Flutter Dependencies Recommended
*   `cloud_firestore`: For database interactions.
*   `firebase_storage`: For media uploads.
*   `image_picker`: For selecting photos/videos.
*   `google_maps_flutter`: For the map step.
*   `geolocator` & `geocoding`: For current location and address resolution.
*   `provider` or `flutter_bloc`: For managing the multi-step form state.
