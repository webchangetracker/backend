import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../../env.js";
import { db } from "../db/index.js";
import { usersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

interface JWTPayload {
  userId: number;
}

declare global {
  namespace Express {
    interface Request {
      user: {
        id: number;
        email: string;
        passwordHash: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JWTPayload;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}
