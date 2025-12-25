// Backend: src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { authConfig } from '../config/auth';

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { active, role, search } = req.query;

    const where: any = {};
    if (active !== undefined) {
      where.active = active === 'true';
    }
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        hourlyRate: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        hourlyRate: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName, role, hourlyRate } = req.body;
    const errors: string[] = [];

    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Email is not valid');
      }
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (role && !Object.values(UserRole).includes(role)) {
      errors.push('Role is not valid');
    }

    let normalizedHourlyRate: number | undefined = undefined;

    if (hourlyRate !== undefined && hourlyRate !== null) {
      const rateNumber = Number(hourlyRate);
      if (Number.isNaN(rateNumber) || rateNumber < 0) {
        errors.push('Hourly rate must be a positive number');
      } else {
        normalizedHourlyRate = rateNumber;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, authConfig.bcryptSaltRounds);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role || UserRole.consultant,
        hourlyRate: normalizedHourlyRate,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        hourlyRate: true,
        active: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    next(error);
  }
};
