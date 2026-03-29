import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import type { UserRole } from '../types/index.js';

// ─── DTOs / Return shapes ─────────────────────────────────────────────────────

export interface UpdateProfileDto {
  name?: string;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface PaginatedUsers {
  users: UserListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ListUsersQuery {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toListItem(doc: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
}): UserListItem {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isEmailVerified: doc.isEmailVerified,
    createdAt: doc.createdAt,
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function getUserById(userId: string): Promise<UserListItem> {
  const user = await User.findById(userId).lean().exec();

  if (user === null) {
    throw new AppError('User not found', 404);
  }

  return toListItem(user);
}

export async function updateProfile(
  userId: string,
  dto: UpdateProfileDto,
): Promise<UserListItem> {
  const user = await User.findByIdAndUpdate(userId, dto, {
    new: true,
    runValidators: true,
  })
    .lean()
    .exec();

  if (user === null) {
    throw new AppError('User not found', 404);
  }

  return toListItem(user);
}

export async function listUsers(query: ListUsersQuery): Promise<PaginatedUsers> {
  const { page, limit, role, search } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (role !== undefined) {
    filter['role'] = role;
  }

  if (search !== undefined) {
    filter['$or'] = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).lean().exec(),
    User.countDocuments(filter).exec(),
  ]);

  return {
    users: users.map(toListItem),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function deleteUser(userId: string): Promise<void> {
  const user = await User.findByIdAndDelete(userId).lean().exec();

  if (user === null) {
    throw new AppError('User not found', 404);
  }
}
