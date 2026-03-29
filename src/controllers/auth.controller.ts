import type { Request, Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import * as authService from '../services/auth.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import type {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
} from '../services/auth.service.js';

export async function register(req: Request, res: Response): Promise<void> {
  const dto = req.body as RegisterDto;
  const result = await authService.registerUser(dto);
  sendCreated(res, 'Registration successful', result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const dto = req.body as LoginDto;
  const result = await authService.loginUser(dto);
  sendSuccess(res, 'Login successful', result);
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const { _id } = (req as AuthRequest).user;
  const user = await authService.getMe(_id.toString());
  sendSuccess(res, 'User fetched', user);
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { _id } = (req as AuthRequest).user;
  const dto = req.body as ChangePasswordDto;
  await authService.changePassword(_id.toString(), dto);
  sendSuccess(res, 'Password changed successfully');
}
