// Express Application Setup - VERSIONE INIZIALE
import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { logStream } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

// Import routes
import authRoutes from "./routes/auth.routes";
import projectRoutes from './routes/projects.routes';
import taskRoutes from './routes/tasks.routes';

// Le altre routes verranno aggiunte man mano che le implementiamo
// import documentRoutes from './routes/documents.routes';
// import userRoutes from './routes/users.routes';
// import clientRoutes from './routes/clients.routes';
// import reviewRoutes from './routes/reviews.routes';
// import timeRoutes from './routes/time.routes';
// import reportRoutes from './routes/reports.routes';
// import notificationRoutes from './routes/notifications.routes';

const app: Express = express();

// Trust the first proxy to correctly read X-Forwarded-* headers in hosted environments
// (required for express-rate-limit to identify clients behind a load balancer)
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Root endpoint (aggiungi questo)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'TP Management API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
    }
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Le altre routes verranno decommentate quando le creeremo
// app.use('/api/documents', documentRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/clients', clientRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/time-entries', timeRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
