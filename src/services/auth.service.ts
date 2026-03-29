import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import type { RegisterDto, LoginDto, ChangePasswordDto, UserDto, AuthResult } from '../dtos/index.js';
import signToken, { generateEmailVerificationToken, verifyEmailToken, generatePasswordResetToken, verifyPasswordResetToken } from '../utils/jwt.js';
import { comparePassword, hashPassword, toUserDto } from '../utils/auth.utils.js';
import { sendEmailVerification, sendPasswordResetEmail } from './email.service.js';
import { env } from '../config/env.js';

// ─── Service functions ────────────────────────────────────────────────────────

export async function registerUser(dto: RegisterDto): Promise<AuthResult> {
  const { name, email, password, confirmPassword } = dto;
  const existing = await User.findOne({ email }).lean().exec();

  if (existing !== null) {
    throw new AppError('Email already registered', 409);
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name: name,
    email: email,
    password: hashedPassword,
    isEmailVerified: false,
  });

  // Generate verification token and send email
  const verificationToken = generateEmailVerificationToken(user._id.toString(), user.email);
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  
  await sendEmailVerification(user.email, verifyUrl);

  const token = signToken(user._id.toString(), user.email, user.role);

  return { token, user: toUserDto(user) };
}

export async function loginUser(dto: LoginDto): Promise<AuthResult> {
  const { email, password } = dto;
  const user = await User.findOne({ email }).select('+password').exec();

  if (user === null || !(await comparePassword(password, user.password))) {
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
  const { currentPassword, newPassword } = dto;
  if (user === null) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await comparePassword(currentPassword, user.password);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  await user.save();
}

// ─── Email Verification ───────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<UserDto> {
  try {
    const payload = verifyEmailToken(token);

    const user = await User.findById(payload.userId).exec();

    if (user === null) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email already verified', 400);
    }

    user.isEmailVerified = true;
    await user.save();

    return toUserDto(user);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired verification token', 401);
  }
}

// ─── Password Reset ────────────────────────────────────────────────────────────

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email }).exec();

  if (user === null) {
    throw new AppError('You are not registered with this Email', 400);
  }

  // Generate reset token and send email
  const resetToken = generatePasswordResetToken(user._id.toString(), user.email);
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await sendPasswordResetEmail(user.email, resetUrl);
}

export async function resetPassword(token: string, newPassword: string): Promise<UserDto> {
  try {
    const payload = verifyPasswordResetToken(token);

    const user = await User.findById(payload.userId).exec();

    if (user === null) {
      throw new AppError('User not found', 404);
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return toUserDto(user);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired password reset token', 401);
  }
}
