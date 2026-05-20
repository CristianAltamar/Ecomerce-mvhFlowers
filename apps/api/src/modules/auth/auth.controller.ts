import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { AuthenticatedRequest } from '../../middlewares/auth';
import type { RegisterInput, LoginInput, RefreshInput } from './auth.schemas';

function extractContext(req: Request) {
  return {
    userAgent: req.get('user-agent') ?? undefined,
    ipAddress: req.ip,
  };
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body as RegisterInput, extractContext(req));
    sendCreated(res, result);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body as LoginInput, extractContext(req));
    sendSuccess(res, result);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshInput;
    const result = await authService.refresh(refreshToken, extractContext(req));
    sendSuccess(res, result);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshInput;
    await authService.logout(refreshToken);
    sendNoContent(res);
  }),

  me: asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const user = await authService.me(req.user.sub);
    sendSuccess(res, user);
  }),
};
