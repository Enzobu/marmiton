import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const emailSchema = z.string().trim().email().max(254).transform(value => value.toLowerCase());
export const passwordSchema = z.string().min(12).max(128)
  .regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/);

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 40 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await derive(password, salt)).toString('hex')}`;
}

export async function verifyPassword(password: string, hash?: string) {
  const [salt, expected] = (hash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
  return timingSafeEqual(await derive(password, salt), Buffer.from(expected, 'hex')) && Boolean(hash);
}
