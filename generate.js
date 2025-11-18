const crypto = require('crypto');

const SECRET_SEED = 'default-secret-change-me-in-production';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function deriveKey(seed) {
  const salt = crypto.createHash('sha256').update(seed).digest();
  return crypto.pbkdf2Sync(seed, salt, 100000, KEY_LENGTH, 'sha256');
}

function generateToken(seat, room) {
  const data = `${seat}:${room}`;
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(SECRET_SEED);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, encrypted, tag]);
  
  return combined.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const seat = process.argv[2] || '12';
const room = process.argv[3] || '100';
const token = generateToken(seat, room);

console.log(`Token for Seat: ${seat}, Room: ${room}`);
console.log(`Token: ${token}`);
console.log(`\nFull URL:`);
console.log(`http://localhost:3000/waiting-room?token=${token}`);