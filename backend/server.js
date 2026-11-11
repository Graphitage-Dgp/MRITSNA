import "./src/config/env.js";
import app from "./src/app.js";
import connectToDB from "./src/config/db.js";
import mongoose from "mongoose";
import initCurrencyUpdater from './src/cron/currencyUpdater.js';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; 
let server; 

// Graceful Shutdown Protocol
const exitHandler = () => {
  if (server) {
    server.close(async () => {
      console.log("[Server] Closed remaining HTTP connections.");
      try {
        await mongoose.connection.close(false);
        console.log("[Database] Mongo connection securely closed.");
      } catch (err) {
        console.error("[Database] Error while closing Mongo connection:", err);
      }
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

// Catch rogue unhandled promises globally and shut down SAFELY
process.on("unhandledRejection", (err) => {
  console.error("[Unhandled Rejection] Shutting down gracefully...");
  console.error(err.name, err.message);
  exitHandler(); 
});

process.on("uncaughtException", (err) => {
  console.error("[Uncaught Exception] Shutting down gracefully...");
  console.error(err.name, err.message);
  exitHandler();
});

// Initialize Database Connection
connectToDB()
  .then(() => {
    // 2. Start HTTP Server ONLY after DB is ready, binding to 0.0.0.0
    server = app.listen(PORT, HOST, () => {
      console.log(`[Server] API running on http://${HOST}:${PORT}`);
      console.log(`[Environment] ${process.env.NODE_ENV || 'development'}`);
    }); 

    // Handle termination signals (Ctrl+C, Docker stop, Railway redeploys)
    process.on("SIGTERM", () => {
      console.log("SIGTERM received");
      exitHandler();
    });
    process.on("SIGINT", () => {
      console.log("SIGINT received");
      exitHandler();
    });

    // Start background jobs safely after DB is connected
    initCurrencyUpdater();
  })
  .catch((err) => {
    console.error("[Server] Database Initialization failed:", err);
    process.exit(1);
  });