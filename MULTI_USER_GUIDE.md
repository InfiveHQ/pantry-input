# Multi-User Household Support Guide

## How Multi-User Support Works

### 1. **Household-Based Access Control**
- Each pantry item belongs to a specific household
- Users can only see/edit items from households they're members of
- Household owners can invite/remove members
- All members can add, edit, and delete items in their shared household

### 2. **Role-Based Permissions**
- **Owner**: Can manage household settings, invite/remove members, and manage all items
- **Member**: Can add, edit, and delete items in the household
- Both roles can view all items in the household

### 3. **Security Model**
- Row Level Security (RLS) policies ensure data isolation
- Users can only access data from households they belong to
- API endpoints verify membership before allowing operations

## Database Schema

### Key Tables:

1. **`households`** - Stores household information
   - `id` (UUID) - Primary key
   - `name` (TEXT) - Household name
   - `owner_id` (UUID) - References auth.users
   - `created_at`, `updated_at` - Timestamps

2. **`household_members`** - Links users to households
   - `id` (UUID) - Primary key
   - `household_id` (UUID) - References households
   - `user_id` (UUID) - References auth.users
   - `role` (TEXT) - 'owner' or 'member'
   - `created_at` - Timestamp

3. **`pantry_items`** - Stores items with household association
   - `id` (SERIAL) - Primary key
   - `household_id` (UUID) - References households
   - `created_by` (UUID) - References auth.users
   - All existing item fields (name, brand, etc.)
   - `created_at`, `updated_at` - Timestamps

4. **`profiles`** - User profile information
   - `id` (UUID) - References auth.users
   - `email` (TEXT) - User email
   - `full_name` (TEXT) - User's full name

## RLS Policies Explained

### Household Access:
```sql
-- Users can only view households they're members of
CREATE POLICY "Users can view their households" ON households
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_members 
      WHERE household_members.household_id = households.id 
      AND household_members.user_id = auth.uid()
    )
  );
```

### Pantry Item Access:
```sql
-- Users can only view items from households they belong to
CREATE POLICY "Users can view household pantry items" ON pantry_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_members 
      WHERE household_members.household_id = pantry_items.household_id 
      AND household_members.user_id = auth.uid()
    )
  );
```

## API Endpoints

### Household Management:
- `GET /api/households?user_id=<id>` - Get user's households
- `POST /api/households` - Create new household
- `GET /api/household-members?household_id=<id>` - Get household members
- `POST /api/household-members` - Invite member
- `DELETE /api/household-members?household_id=<id>&user_id=<id>` - Remove member

### Pantry Items (Multi-User):
- `GET /api/pantry-items?household_id=<id>` - Get household's items
- `POST /api/pantry-items` - Add item to household
- `PUT /api/pantry-items` - Update item
- `DELETE /api/pantry-items?id=<id>&user_id=<id>` - Delete item

## Implementation Steps

### 1. **Database Setup**
Run the complete SQL script (`database-setup-complete.sql`) in your Supabase dashboard.

### 2. **Environment Variables**
Add to your `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. **Update Product Form**
Add household selection to the product form:

```typescript
// In ProductForm.tsx
const [selectedHousehold, setSelectedHousehold] = useState<string | null>(null);

// Add household selector
<select 
  value={selectedHousehold || ''} 
  onChange={(e) => setSelectedHousehold(e.target.value)}
  required
>
  {households.map(household => (
    <option key={household.id} value={household.id}>
      {household.name}
    </option>
  ))}
</select>

// Include household_id in form submission
const formData = {
  ...otherData,
  household_id: selectedHousehold,
  created_by: user.id
};
```

### 4. **Update Inventory Page**
Filter items by selected household:

```typescript
// In inventory.tsx
const [selectedHousehold, setSelectedHousehold] = useState<string | null>(null);

const fetchItems = async () => {
  if (!selectedHousehold) return;
  
  const response = await fetch(`/api/pantry-items?household_id=${selectedHousehold}`);
  const data = await response.json();
  setItems(data);
};
```

### 5. **Add Household Context**
Create a context for managing the selected household:

```typescript
// HouseholdContext.tsx
interface HouseholdContextType {
  selectedHousehold: string | null;
  setSelectedHousehold: (id: string | null) => void;
  households: Household[];
  loading: boolean;
}

export const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);
```

## User Experience Flow

### 1. **First Time User:**
1. Sign up/login
2. Create a household or get invited to one
3. Select household from dropdown
4. Start adding items to shared pantry

### 2. **Adding Items:**
1. Select household from dropdown
2. Scan barcode or manually enter item
3. Item is automatically associated with selected household
4. All household members can see the item

### 3. **Managing Items:**
1. View items filtered by selected household
2. Edit/delete items (all members can do this)
3. See who added each item

### 4. **Household Management:**
1. Owners can invite new members by email
2. Owners can remove members
3. All members can view household member list

## Security Features

### 1. **Data Isolation:**
- Users can only see items from their households
- API endpoints verify membership before operations
- RLS policies enforce access control at database level

### 2. **Permission Checks:**
- Only household owners can invite/remove members
- All members can add/edit/delete items
- Users cannot access data from households they don't belong to

### 3. **Audit Trail:**
- Each item tracks who created it (`created_by`)
- Timestamps for all operations
- Full history of changes

## Benefits of This Approach

### 1. **Scalability:**
- Supports unlimited households per user
- Efficient database queries with proper indexing
- Real-time updates possible with Supabase subscriptions

### 2. **Flexibility:**
- Users can belong to multiple households
- Different permission levels (owner/member)
- Easy to extend with additional roles

### 3. **Security:**
- Database-level security with RLS
- API-level verification
- No data leakage between households

### 4. **User Experience:**
- Seamless household switching
- Clear ownership and membership indicators
- Intuitive invitation system

## Next Steps for Full Implementation

1. **Add household selector to all forms**
2. **Update inventory filtering**
3. **Add real-time updates with Supabase subscriptions**
4. **Implement household switching UI**
5. **Add notifications for new items**
6. **Create household-specific settings**

This multi-user system provides a solid foundation for shared pantry management while maintaining security and scalability. 