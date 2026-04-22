import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
export const hashPassword = (p)=>bcrypt.hash(p,10);
export const verifyPassword = (p,h)=>bcrypt.compare(p,h);

const PASSWORD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateRandomPassword(length = 10) {
  return Array.from({ length }, () => PASSWORD_ALPHABET[randomInt(0, PASSWORD_ALPHABET.length)]).join('');
}
