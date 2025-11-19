# Secure Token System for Seat/Room URLs

## Overview

This system uses **encrypted tokens** instead of plain seat/room parameters in URLs. This prevents users from tampering with URLs to change their seat or room assignments.

## How It Works

### 1. **Token Generation** (Admin/Manual)
When creating QR codes, generate a token using the API:

```
GET /api/generate-token?seat=12&room=100
```

**Response:**
```json
{
  "success": true,
  "seat": "12",
  "room": "100",
  "token": "aBc123XyZ...",
  "url": "https://yoursite.com/?token=aBc123XyZ...",
  "qrCodeUrl": "https://yoursite.com/?token=aBc123XyZ..."
}
```

### 2. **User Flow**
1. User scans QR code → Gets URL: `/?token=aBc123XyZ...`
2. System decrypts token → Extracts seat "12" and room "100"
3. If token is invalid/tampered → Access denied ❌
4. If token is valid → User proceeds to seat assignment ✅

### 3. **Security Features**
- ✅ **Encrypted**: Seat/room data is encrypted using AES-256-GCM
- ✅ **Tamper-proof**: Any modification to token invalidates it
- ✅ **No database needed**: Tokens are deterministic (same seat+room = same token with same seed)
- ✅ **Never expires**: Tokens work forever (as requested)
- ✅ **Reusable**: Same token can be used multiple times

## Setup

### 1. Set Secret Seed

Add to your `.env.local` file:

```env
SEAT_TOKEN_SECRET=your-super-secret-random-string-here-minimum-32-characters
```

**Important:** 
- Use a long, random string (at least 32 characters)
- Never commit this to version control
- Use the same secret in all environments (dev, staging, production)
- If you change the secret, all existing tokens will become invalid

### 2. Generate Tokens for QR Codes

**Option A: Using the API endpoint**
```bash
# Generate token for seat 12, room 100
curl "http://localhost:3000/api/generate-token?seat=12&room=100"

# Response includes the full URL for QR code
```

**Option B: Using Node.js script**
```javascript
import { generateToken } from './lib/token-utils';

const token = generateToken("12", "100");
const url = `https://yoursite.com/?token=${token}`;
console.log("QR Code URL:", url);
```

## Token Format

Tokens are:
- Base64-encoded (URL-safe)
- Encrypted using AES-256-GCM
- Include authentication tag to prevent tampering
- Format: `[IV][EncryptedData][AuthTag]` → base64

Example token:
```
aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890
```

## Migration from Old System

The system maintains **backward compatibility**:
- ✅ Old URLs with `?seat=12&room=100` still work (legacy mode)
- ✅ New URLs with `?token=...` are preferred (secure mode)
- ⚠️ Legacy mode will show a warning in logs

**Recommended:** Migrate all QR codes to use tokens for security.

## API Reference

### Generate Token
```
GET /api/generate-token?seat={seat}&room={room}
```

**Parameters:**
- `seat` (required): Seat number (e.g., "12", "112")
- `room` (optional): Room number (default: "100")

**Response:**
```json
{
  "success": true,
  "seat": "12",
  "room": "100",
  "token": "encrypted-token-here",
  "url": "https://yoursite.com/?token=encrypted-token-here",
  "qrCodeUrl": "https://yoursite.com/?token=encrypted-token-here"
}
```

**Error Response:**
```json
{
  "error": "Invalid seat format",
  "message": "Seat must start with 0 or 1, followed by digits"
}
```

## Security Notes

1. **Secret Management**
   - Store `SEAT_TOKEN_SECRET` securely
   - Never expose it in client-side code
   - Use different secrets for different environments if needed

2. **Token Validation**
   - Tokens are validated server-side only
   - Invalid tokens are rejected immediately
   - No information about seat/room is leaked in error messages

3. **Token Reuse**
   - Same seat+room combination generates the same token (with same seed)
   - Tokens can be reused indefinitely
   - No expiration or usage limits

4. **What Users Can't Do**
   - ❌ Modify token to change seat number
   - ❌ Guess tokens for other seats
   - ❌ Extract seat/room from token (encrypted)
   - ❌ Reuse token for different seat (token is bound to seat+room)

## Troubleshooting

### "Invalid token" error
- Check that `SEAT_TOKEN_SECRET` is set correctly
- Ensure token wasn't modified in URL
- Verify token was generated with same secret

### Token doesn't work after deployment
- Ensure `SEAT_TOKEN_SECRET` is set in production environment
- Check that secret matches the one used to generate tokens

### Need to regenerate all tokens
- If you change `SEAT_TOKEN_SECRET`, all existing tokens become invalid
- You'll need to regenerate QR codes with new tokens

## Example: Generating QR Codes

```bash
# Generate tokens for all seats
for seat in 01 02 03 11 12 13; do
  curl "http://localhost:3000/api/generate-token?seat=$seat&room=100" | jq -r '.qrCodeUrl'
done

# Output:
# http://localhost:3000/?token=abc123...
# http://localhost:3000/?token=def456...
# ...
```

Then use these URLs to generate QR codes for each seat.

