import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import type { JwtPayload, UserRole } from '../types/index.js';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ─── Return shapes ────────────────────────────────────────────────────────────

export interface AuthResult {
  token: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signToken(userId: string, email: string, role: UserRole): string {
  const payload: JwtPayload = { userId, email, role };
  const secret: Secret = process.env.JWT_SECRET as Secret;

  const expiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];

  return jwt.sign(payload, secret, { expiresIn });
}

function toUserDto(doc: {
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

// ─── Service functions ────────────────────────────────────────────────────────

export async function registerUser(dto: RegisterDto): Promise<AuthResult> {
  const existing = await User.findOne({ email: dto.email }).lean().exec();

  if (existing !== null) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({
    name: dto.name,
    email: dto.email,
    password: dto.password,
  });

  const token = signToken(user._id.toString(), user.email, user.role);

  return { token, user: toUserDto(user) };
}

export async function loginUser(dto: LoginDto): Promise<AuthResult> {
  const user = await User.findOne({ email: dto.email }).select('+password').exec();

  if (user === null || !(await user.comparePassword(dto.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user._id.toString(), user.email, user.role);

  return { token, user: toUserDto(user) };
}

export async function getMe(userId: string): Promise<UserDto> {
  const user = await User.findById(userId).lean().exec();

  if (user === null) {
    throw new AppError('User not found', 404);
  }

  return toUserDto(user);
}

export async function changePassword(
  userId: string,
  dto: ChangePasswordDto,
): Promise<void> {
  const user = await User.findById(userId).select('+password').exec();

  if (user === null) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await user.comparePassword(dto.currentPassword);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = dto.newPassword;
  await user.save();
}
