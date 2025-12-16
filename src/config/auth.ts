// JWT configuration and utilities
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    "your-refresh-secret-key-change-in-production",
  jwtExpiration: process.env.JWT_EXPIRATION || "15m",
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
  bcryptSaltRounds: 10,
};

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiration,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, authConfig.jwtRefreshSecret, {
    expiresIn: authConfig.jwtRefreshExpiration,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, authConfig.jwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, authConfig.jwtRefreshSecret) as RefreshTokenPayload;
};

// Role hierarchy for authorization
export const roleHierarchy: Record<UserRole, number> = {
  admin: 5,
  partner: 4,
  manager: 3,
  senior: 2,
  consultant: 1,
  support: 0,
};

export const hasPermission = (
  userRole: UserRole,
  requiredRole: UserRole,
): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};