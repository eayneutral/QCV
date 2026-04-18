// AES-256-GCM encryption and decryption
import { createCipheriv, createDecipheriv } from 'crypto';

// TODO: Implement AES-256-GCM encryption
export function encrypt(data: Buffer, key: Buffer, iv: Buffer): Buffer {
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([encrypted, authTag]);
}

// TODO: Implement AES-256-GCM decryption
export function decrypt(
  encryptedData: Buffer,
  key: Buffer,
  iv: Buffer,
): Buffer {
  const authTag = encryptedData.slice(encryptedData.length - 16);
  const encrypted = encryptedData.slice(0, encryptedData.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
