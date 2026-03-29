import { Schema, model } from 'mongoose';
import type { Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/index.js';

// ─── Document interface ───────────────────────────────────────────────────────

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  stripeCustomerId?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document<Types.ObjectId> {
  comparePassword(candidate: string): Promise<boolean>;
}

interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.User,
    },
    stripeCustomerId: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// ─── Hooks ────────────────────────────────────────────────────────────────────

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ─── Methods ──────────────────────────────────────────────────────────────────

userSchema.methods['comparePassword'] = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this['password'] as string);
};

userSchema.statics['findByEmail'] = function (
  email: string,
): Promise<IUserDocument | null> {
  return this.findOne({ email }).exec() as Promise<IUserDocument | null>;
};

export const User = model<IUserDocument, IUserModel>('User', userSchema);
