import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is always 16 bytes
const SALT_LENGTH = 32; // 256 bits
const TAG_LENGTH = 16; // For GCM, this is always 16 bytes
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the encryption key from environment variable
 * @returns Buffer containing the encryption key
 */
function getEncryptionKey(): Buffer {
  const encHash = process.env.ENC_HASH;
  if (!encHash) {
    throw new Error('ENC_HASH environment variable is not set');
  }
  
  // Use PBKDF2 to derive a key from the ENC_HASH
  // This ensures we always get a 32-byte key regardless of ENC_HASH length
  const salt = Buffer.from('baby-tracker-salt'); // Static salt for consistency
  return crypto.pbkdf2Sync(encHash, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a string using AES-256-GCM
 * @param text The text to encrypt
 * @returns Encrypted string in format: iv:salt:tag:encryptedData (base64 encoded)
 */
export function encrypt(text: string): string {
  try {
    if (!text) {
      throw new Error('Text to encrypt cannot be empty');
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(salt); // Use salt as additional authenticated data
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV, salt, tag, and encrypted data
    const combined = `${iv.toString('base64')}:${salt.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
    
    return combined;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string using AES-256-GCM
 * @param encryptedData The encrypted string in format: iv:salt:tag:encryptedData
 * @returns Decrypted string
 */
export function decrypt(encryptedData: string): string {
  try {
    if (!encryptedData) {
      throw new Error('Encrypted data cannot be empty');
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivBase64, saltBase64, tagBase64, encrypted] = parts;
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const salt = Buffer.from(saltBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    decipher.setAAD(salt);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a string appears to be encrypted data
 * @param data The string to check
 * @returns True if the string appears to be encrypted
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  
  // Check if it matches our encryption format: iv:salt:tag:encryptedData
  const parts = data.split(':');
  if (parts.length !== 4) return false;
  
  try {
    // Try to decode each part as base64
    Buffer.from(parts[0], 'base64');
    Buffer.from(parts[1], 'base64');
    Buffer.from(parts[2], 'base64');
    return true;
  } catch {
    return false;
  }
} 