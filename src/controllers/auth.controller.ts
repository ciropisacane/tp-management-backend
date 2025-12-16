// Authentication Controller
import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { asyncHandler } from "../middleware/error.middleware";

class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  /**
   * POST /api/auth/login
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    const result = await authService.refreshToken(refreshToken);

    // Update refresh token in cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  });

  /**
   * POST /api/auth/logout
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user!.userId);

    res.json({
      success: true,
      data: user,
    });
  });

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.user!.userId,
      currentPassword,
      newPassword,
    );

    res.json({
      success: true,
      message: result.message,
    });
  });
}

// IMPORTANTE: Esporta una ISTANZA della classe, non la classe stessa
export const authController = new AuthController();
