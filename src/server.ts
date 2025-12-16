import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./utils/logger";
import { testDatabaseConnection } from "./config/database";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error("Failed to connect to database");
    }

    // Start server - IMPORTANTE: 0.0.0.0 per Replit
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Local: http://localhost:${PORT}/api`);

      // URL pubblico per Replit
      if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
        const publicUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        logger.info(`🌐 Public URL: ${publicUrl}`);
        logger.info(`🧪 Health check: ${publicUrl}/health`);
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
