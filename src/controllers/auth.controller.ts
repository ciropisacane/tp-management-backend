// Authentication Controller
import { Request, Response } from "express";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../middleware/error.middleware";

const prisma = new PrismaClient();

class AuthController {

  /**
   * Register a new organization and admin user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, organizationName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Transaction: Create Organization -> Create User
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: organizationName }
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          organizationId: org.id,
          role: UserRole.admin
        }
      });

      return { org, user };
    });

    // Generate Token
    const token = this.generateToken(result.user);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          organizationId: result.user.organizationId,
          firstName: result.user.firstName,
          lastName: result.user.lastName
        },
        organization: result.org,
        accessToken: token,
      },
    });
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate Token
    const token = this.generateToken(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          firstName: user.firstName,
          lastName: user.lastName
        },
        accessToken: token,
      },
    });
  });

  /**
   * Get Current User
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    // req.user is set by middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { organization: true }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { passwordHash, ...userData } = user;
    res.json({ success: true, data: userData });
  });

  // Helper
  private generateToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
  }

  // Placeholder for logout/refresh/change-password if needed to keep imports happy
  logout = asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out" });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    res.status(501).json({ message: "Not implemented in MVP" });
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    res.status(501).json({ message: "Not implemented in MVP" });
  });
}

export const authController = new AuthController();
