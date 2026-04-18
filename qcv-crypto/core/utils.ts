// Utility functions for generating and managing IVs and salts

import { randomBytes } from 'crypto';

// TODO: Implement secure IV generation
export function generateIv(): Buffer {
  return randomBytes(12); // 96 bits for GCM
}

// TODO: Implement secure salt generation
export function generateSalt(): Buffer {
  return randomBytes(16); // 128 bits
}
