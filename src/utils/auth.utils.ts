import bcrypt from 'bcryptjs';
import type { UserRole } from '../types/index.js';
import type { UserDto } from '../dtos/index.js';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(candidate: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(candidate, hashed);
}

export function toUserDto(doc: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
}): UserDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isEmailVerified: doc.isEmailVerified,
  };
}