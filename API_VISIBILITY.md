# API Routes Visibility - What Users Can See

## Quick Answer

**Users CAN access your API routes (make requests to them), but they CANNOT see the source code inside them.**

## Detailed Explanation

### What Users CAN Do

✅ **Access API endpoints** (make HTTP requests):
- Users can visit: `https://your-app.vercel.app/api/linkedin/auth`
- Users can visit: `https://your-app.vercel.app/api/linkedin/callback`
- Users can visit: `https://your-app.vercel.app/api/linkedin/fetch-and-send`

✅ **See API responses**:
- They'll see redirects or JSON responses
- They'll see error messages (if any)

### What Users CANNOT Do

❌ **See the source code**:
- They cannot see your `route.ts` files
- They cannot see `process.env.LINKEDIN_CLIENT_SECRET`
- They cannot see the logic inside your API routes
- They cannot see environment variables

❌ **Access server-side execution**:
- The code runs on Vercel's servers
- Users only see the **output** (responses), not the **code**

## Example

### What Happens When User Visits `/api/linkedin/auth`

**User's Browser:**
```
GET https://your-app.vercel.app/api/linkedin/auth
↓
Response: HTTP 302 Redirect to LinkedIn
```

**What User Sees:**
- Redirect to LinkedIn login page
- That's it!

**What User CANNOT See:**
```typescript
// ❌ User CANNOT see this code:
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const authUrl = `https://www.linkedin.com/oauth/v2/authorization?...`;
```

### What Happens When User Visits `/api/linkedin/callback`

**User's Browser:**
```
GET https://your-app.vercel.app/api/linkedin/callback?code=xxx
↓
Response: HTTP 302 Redirect to /api/linkedin/fetch-and-send
↓
Response: HTTP 302 Redirect to /Home?linkedin=connected
```

**What User Sees:**
- Redirects (they get redirected automatically)
- Final redirect to Home page

**What User CANNOT See:**
```typescript
// ❌ User CANNOT see this code:
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
  body: new URLSearchParams({
    client_secret: clientSecret, // SECRET - user cannot see this!
  }),
});
```

## File Structure Visibility

### Files Users CAN See (in browser DevTools)

```
app/
  Home/
    page.tsx          ← ✅ Visible (React component sent to browser)
  layout.tsx          ← ✅ Visible (HTML structure)
  globals.css         ← ✅ Visible (CSS styles)
```

### Files Users CANNOT See

```
app/
  api/
    linkedin/
      auth/
        route.ts      ← ❌ NOT visible (server-side only)
      callback/
        route.ts      ← ❌ NOT visible (server-side only)
      fetch-and-send/
        route.ts      ← ❌ NOT visible (server-side only)
```

## How Next.js Protects API Routes

1. **API routes are server-side only**
   - They run on Vercel's servers
   - Code never gets bundled into client JavaScript
   - Only the **responses** are sent to the browser

2. **Environment variables are stripped**
   - `process.env.*` variables are replaced at build time
   - Only variables prefixed with `NEXT_PUBLIC_` are exposed
   - Your `LINKEDIN_CLIENT_SECRET` is **never** in the client bundle

3. **Source maps don't include API routes**
   - Even with source maps enabled, API route code isn't included

## Testing This Yourself

### Test 1: View Source
1. Deploy to Vercel
2. Right-click → View Page Source
3. Search for "LINKEDIN_CLIENT_SECRET"
4. **Result**: Not found! ✅

### Test 2: Check Network Tab
1. Open DevTools → Network
2. Visit `/api/linkedin/auth`
3. Check the request/response
4. **What you see**: Redirect response
5. **What you DON'T see**: The code that generated it ✅

### Test 3: Check Sources Tab
1. Open DevTools → Sources
2. Look for your API route files
3. **Result**: They're not there! ✅
4. Only client-side code is visible

## Summary

| Aspect | User Can See? |
|--------|---------------|
| API endpoint URLs | ✅ Yes (they can make requests) |
| API route source code | ❌ No (server-side only) |
| Environment variables | ❌ No (never in client bundle) |
| `CLIENT_SECRET` | ❌ No (server-side only) |
| API responses | ✅ Yes (redirects, JSON, etc.) |
| Frontend pages (`/Home`) | ✅ Yes (React components) |

## Your Current Setup is Secure ✅

- All API routes are server-side only
- Secrets are never exposed
- Users can only interact with your APIs, not see the code

