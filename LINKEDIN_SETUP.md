# LinkedIn OAuth Integration Setup

This guide will help you set up LinkedIn OAuth integration to fetch user data and send it to your API.

## Prerequisites

1. A LinkedIn Developer Account
2. A LinkedIn App created in the LinkedIn Developer Portal

## Step 1: Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in the required information:
   - App name
   - Company LinkedIn Page
   - Privacy policy URL
   - App logo
4. Submit the form

## Step 2: Configure OAuth Settings

1. In your LinkedIn app, go to the "Auth" tab
2. Under "Redirect URLs", add your callback URL:
   - For development: `http://localhost:3000/api/linkedin/callback`
   - For production: `https://your-domain.com/api/linkedin/callback`
3. Under "Products", request access to:
   - **Sign In with LinkedIn using OpenID Connect** (required)
   - This will give you access to basic profile information

## Step 3: Get Your Credentials

1. In the "Auth" tab, you'll find:
   - **Client ID** (also called Client ID)
   - **Client Secret** (click "Show" to reveal it)
2. Copy these values

## Step 4: Configure Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# LinkedIn OAuth Configuration
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback

# Your API URL (where to send the LinkedIn data)
# This should be your backend API endpoint that accepts POST requests
YOUR_API_URL=https://your-api-domain.com/api
```

**Important:** 
- Never commit `.env.local` to version control
- Use different credentials for development and production
- Update `LINKEDIN_REDIRECT_URI` for production

## Step 5: Configure Your API Endpoint

Your API should have an endpoint that accepts POST requests at `/update-seat` (or update the route in `app/api/linkedin/fetch-and-send/route.ts`).

The POST request will include the following JSON body:

```json
{
  "firstName": "Jason",
  "lastName": "Maglde",
  "lID": "JasonMAmaoa/",
  "seatId": "your-seat-id"
}
```

## Step 6: Test the Integration

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/Home` (or with a seat parameter: `http://localhost:3000?seat=SEAT123`)

3. Click the "Connect with LinkedIn" button

4. You'll be redirected to LinkedIn to authorize the app

5. After authorization, you'll be redirected back and the data will be:
   - Fetched from LinkedIn
   - Sent to your API
   - Displayed on the Home page

## API Routes Created

- `/api/linkedin/auth` - Initiates LinkedIn OAuth flow
- `/api/linkedin/callback` - Handles OAuth callback and exchanges code for token
- `/api/linkedin/fetch-and-send` - Fetches LinkedIn data and sends to your API

## Troubleshooting

### "LinkedIn Client ID not configured"
- Make sure your `.env.local` file exists and contains `LINKEDIN_CLIENT_ID`

### "token_exchange_failed"
- Verify your Client Secret is correct
- Check that your redirect URI matches exactly what's configured in LinkedIn

### "linkedin_api_error"
- Ensure you've requested the correct product permissions in LinkedIn
- Check that your app is approved (some permissions require approval)

### "no_seat_id"
- Make sure a seat ID is set in cookies before connecting LinkedIn
- The seat ID should be passed as a query parameter: `?seat=SEAT123`

## Security Notes

- Access tokens are stored temporarily in HTTP-only cookies
- Tokens are cleared after use
- Use HTTPS in production
- Validate and sanitize all data received from LinkedIn before using it

