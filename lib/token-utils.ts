import crypto from 'crypto';

// Secret seed from environment variable - this should be a long random string
// If not set, we'll generate a default (but you should set SEAT_TOKEN_SECRET in .env.local)
const SECRET_SEED = process.env.SEAT_TOKEN_SECRET || 'default-secret-change-me-in-production';

// Algorithm for encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for IV
const SALT_LENGTH = 64; // 64 bytes for salt
const TAG_LENGTH = 16; // 16 bytes for GCM tag
const KEY_LENGTH = 32; // 32 bytes for AES-256

/**
 * Derives a key from the secret seed using PBKDF2
 */
function deriveKey(seed: string): Buffer {
  // Use a fixed salt derived from the seed itself for deterministic key generation
  const salt = crypto.createHash('sha256').update(seed).digest();
  return crypto.pbkdf2Sync(seed, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts seat and room into a secure token
 * @param seat - The seat number (e.g., "12", "112")
 * @param room - The room number (e.g., "100")
 * @returns A base64-encoded token that can be used in URLs
 */
export function generateToken(seat: string, room: string): string {
  try {
    // Create the data to encrypt: "seat:room"
    const data = `${seat}:${room}`;
    
    // Generate a random IV for each encryption
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive the encryption key from the secret seed
    const key = deriveKey(SECRET_SEED);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine IV + encrypted data + tag
    const combined = Buffer.concat([iv, encrypted, tag]);
    
    // Return base64-encoded token (URL-safe)
    return combined.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, ''); // Remove padding for shorter URLs
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
}

/**
 * Decrypts a token back to seat and room
 * @param token - The base64-encoded token from the URL
 * @returns An object with seat and room, or null if token is invalid
 */
export function validateToken(token: string): { seat: string; room: string } | null {
  try {
    // Restore base64 padding and convert URL-safe characters back
    let base64Token = token.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed (base64 strings should be multiples of 4)
    while (base64Token.length % 4) {
      base64Token += '=';
    }
    
    // Decode the token
    const combined = Buffer.from(base64Token, 'base64');
    
    // Extract IV, encrypted data, and tag
    if (combined.length < IV_LENGTH + TAG_LENGTH) {
      console.error('Token too short');
      return null;
    }
    
    const iv = combined.slice(0, IV_LENGTH);
    const tag = combined.slice(-TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH, -TAG_LENGTH);
    
    // Derive the decryption key (same as encryption)
    const key = deriveKey(SECRET_SEED);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Parse the decrypted data: "seat:room"
    const data = decrypted.toString('utf8');
    const [seat, room] = data.split(':');
    
    if (!seat || !room) {
      console.error('Invalid token format - missing seat or room');
      return null;
    }
    
    return { seat, room };
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}

/**
 * Validates that a seat number matches the expected pattern
 */
export function isValidSeatFormat(seat: string): boolean {
  const seatPattern = /^[01]\d+$/;
  return seatPattern.test(seat.trim());
}

