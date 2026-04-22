import express from "express";
import http from "http";
import multer from "multer";
import { AppError } from "./src/common/helpers/app-error.helper.js";
import rootRouter from "./src/routers/root.router.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { logApi } from "./src/common/middlewares/log-api.middleware.js";
import { initLoginGooglePassport } from "./src/common/passport/login-google.passport.js";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./src/common/swagger/init.swagger.js";
import path from "path";
import errorHandler from "./src/common/middlewares/error-handler.middleware.js";

const app = express();

// Parse CORS origins from environment variable or use defaults
const defaultCorsOrigins = [
  "http://localhost:5173",
  "https://nodejs54-capstone-1.vercel.app"
];
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : defaultCorsOrigins;

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(cookieParser());
app.use(logApi("product"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api", rootRouter);

// Multer error handling (must be before global error handler)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  next(err);
});

// Global error handler
app.use(errorHandler);

// Create HTTP server
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 3069;
httpServer.listen(PORT, () => {
  console.log(`Server online at port: ${PORT}`);
});
httpServer.requestTimeout = 0;

