import crypto from 'crypto';

const HASH_ITERATIONS = 100000; // High iteration count for security
const SALT_LENGTH = 32; // 256 bits
const KEY_LENGTH = 64; // 512 bits

/**
 * Hash a password using PBKDF2 with a random salt
 * @param password The plain text password to hash
 * @returns Promise<string> The hashed password in format: salt:hash (base64 encoded)
 */
export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!password) {
      reject(new Error('Password cannot be empty'));
      return;
    }
    
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    crypto.pbkdf2(password, salt, HASH_ITERATIONS, KEY_LENGTH, 'sha256', (err, derivedKey) => {
      if (err) {
        reject(new Error('Failed to hash password'));
        return;
      }
      
      const saltBase64 = salt.toString('base64');
      const hashBase64 = derivedKey.toString('base64');
      const hashedPassword = `${saltBase64}:${hashBase64}`;
      
      resolve(hashedPassword);
    });
  });
}

/**
 * Verify a password against a hash
 * @param password The plain text password to verify
 * @param hashedPassword The stored hash in format: salt:hash
 * @returns Promise<boolean> True if password matches, false otherwise
 */
export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!password || !hashedPassword) {
      resolve(false);
      return;
    }
    
    try {
      const parts = hashedPassword.split(':');
      if (parts.length !== 2) {
        resolve(false);
        return;
      }
      
      const [saltBase64, hashBase64] = parts;
      const salt = Buffer.from(saltBase64, 'base64');
      
      crypto.pbkdf2(password, salt, HASH_ITERATIONS, KEY_LENGTH, 'sha256', (err, derivedKey) => {
        if (err) {
          reject(new Error('Failed to verify password'));
          return;
        }
        
        const providedHashBase64 = derivedKey.toString('base64');
        const isMatch = crypto.timingSafeEqual(
          Buffer.from(hashBase64, 'base64'),
          Buffer.from(providedHashBase64, 'base64')
        );
        
        resolve(isMatch);
      });
    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * Synchronous version of hashPassword for simple use cases
 * Note: This blocks the event loop, use sparingly
 * @param password The plain text password to hash
 * @returns string The hashed password in format: salt:hash (base64 encoded)
 */
export function hashPasswordSync(password: string): string {
  if (!password) {
    throw new Error('Password cannot be empty');
  }
  
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, 'sha256');
  
  const saltBase64 = salt.toString('base64');
  const hashBase64 = derivedKey.toString('base64');
  
  return `${saltBase64}:${hashBase64}`;
}

/**
 * Synchronous version of verifyPassword for simple use cases
 * Note: This blocks the event loop, use sparingly
 * @param password The plain text password to verify
 * @param hashedPassword The stored hash in format: salt:hash
 * @returns boolean True if password matches, false otherwise
 */
export function verifyPasswordSync(password: string, hashedPassword: string): boolean {
  if (!password || !hashedPassword) {
    return false;
  }
  
  try {
    const parts = hashedPassword.split(':');
    if (parts.length !== 2) {
      return false;
    }
    
    const [saltBase64, hashBase64] = parts;
    const salt = Buffer.from(saltBase64, 'base64');
    const derivedKey = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, 'sha256');
    
    const providedHashBase64 = derivedKey.toString('base64');
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(hashBase64, 'base64'),
      Buffer.from(providedHashBase64, 'base64')
    );
    
    return isMatch;
  } catch (error) {
    return false;
  }
}