// Express Application Setup
import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { logStream } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

// Import routes
import authRoutes from "./routes/auth.routes";
import projectRoutes from './routes/projects.routes';
import taskRoutes from './routes/tasks.routes';
import clientRoutes from './routes/clients.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/users.routes';
// Document routes will be imported when controller is ready
// import documentRoutes from './routes/documents.routes';

const app: Express = express();

// Trust proxy for load balancers
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());

// CORS configuration - Allow all for development/Stackblitz
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Request logging
app.use(morgan("combined", { stream: logStream }));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser middleware
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'TP Management API is running',
    version: '1.0.0',
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/documents', documentRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
