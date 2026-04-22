import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/prisma/client.ts";

const url = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  user: url.username,
  password: url.password,
  port: Number(url.port),
  database: url.pathname.substring(1),
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

try {
  console.log("✅ [PRISMA] Connection has been established successfully.");
} catch (error) {
  console.error("❌ Unable to connect to the database:", error);
}

export { prisma };