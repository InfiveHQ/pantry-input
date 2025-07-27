# Debug Guide: JSON Parsing Error

## The Problem
You're getting a "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" error. This means the API is returning HTML instead of JSON, typically indicating a 404 error or server issue.

## Step-by-Step Debugging

### 1. **Test the API Endpoint**
Visit this URL in your browser to test the API:
```
http://localhost:3000/api/test-households
```

**Expected Response:**
```json
{
  "message": "API is working",
  "database": "Connected",
  "tables": "Exist",
  "env_vars": {
    "supabase_url": "Set",
    "service_role_key": "Set"
  }
}
```

**If you get HTML instead of JSON:**
- The API route isn't being found
- Check that the file exists at `src/pages/api/test-households.ts`
- Restart your development server

### 2. **Check Environment Variables**
Make sure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. **Database Setup**
Run the complete database setup script in your Supabase dashboard:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-setup-complete.sql`
4. Execute the script

### 4. **Test Database Connection**
After running the setup script, test again:
```
http://localhost:3000/api/test-households
```

### 5. **Check Browser Console**
Open your browser's developer tools and check:
- **Network tab**: Look for failed API requests
- **Console tab**: Look for JavaScript errors

### 6. **Common Issues and Solutions**

#### Issue: "relation 'households' does not exist"
**Solution:** Run the database setup script

#### Issue: "Invalid API key"
**Solution:** Check your environment variables

#### Issue: "Service role key not found"
**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local`

#### Issue: API returns 404
**Solution:** 
- Check file paths are correct
- Restart development server
- Clear browser cache

### 7. **Manual Testing**

Test the households API directly:
```bash
# Test GET request
curl "http://localhost:3000/api/households?user_id=your_user_id"

# Test POST request
curl -X POST "http://localhost:3000/api/households" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Household","owner_id":"your_user_id"}'
```

### 8. **Development Server Logs**
Check your terminal where you're running `npm run dev` for any error messages.

## Quick Fix Checklist

- [ ] Restart development server
- [ ] Check environment variables
- [ ] Run database setup script
- [ ] Test API endpoint manually
- [ ] Check browser console for errors
- [ ] Verify file paths are correct

## If Still Having Issues

1. **Check the test endpoint first**: `http://localhost:3000/api/test-households`
2. **Look at the exact error message** in the browser console
3. **Check the Network tab** in developer tools to see what the API is actually returning
4. **Verify your Supabase credentials** are correct

The test endpoint will help identify whether the issue is with:
- Database connection
- Missing tables
- Environment variables
- API routing 