// Backend: src/validators/client.validator.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Validate client creation data
 */
export const validateCreateClient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, contactEmail } = req.body;
  const errors: string[] = [];

  // Validate name (required)
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Client name is required');
  } else if (name.trim().length < 2) {
    errors.push('Client name must be at least 2 characters long');
  } else if (name.trim().length > 200) {
    errors.push('Client name must be less than 200 characters');
  }

  // Validate contact email (optional, but must be valid if provided)
  if (contactEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      errors.push('Contact email must be a valid email address');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate client update data
 */
export const validateUpdateClient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, contactEmail } = req.body;
  const errors: string[] = [];

  // Validate name (optional, but must be valid if provided)
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Client name cannot be empty');
    } else if (name.trim().length < 2) {
      errors.push('Client name must be at least 2 characters long');
    } else if (name.trim().length > 200) {
      errors.push('Client name must be less than 200 characters');
    }
  }

  // Validate contact email (optional, but must be valid if provided)
  if (contactEmail !== undefined && contactEmail !== null && contactEmail !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      errors.push('Contact email must be a valid email address');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors
    });
  }

  next();
};
