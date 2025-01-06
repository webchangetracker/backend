import express from "express";
import { eq } from "drizzle-orm";
import { usersTable } from "../db/schema.js";
import { hash, compare } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { ENV } from "../../env.js";
import { z } from "zod";
import { validateBody } from "../utils/zod.utils.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const signupSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});
type SignupBody = z.infer<typeof signupSchema>;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
type LoginBody = z.infer<typeof loginSchema>;

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      fullName: user.fullName,
      email: user.email,
    });
  } catch (error) {
    console.error("/me", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signup", validateBody(signupSchema), async (req, res) => {
  try {
    const { fullName, email, password } = req.body as SignupBody;
    const passwordHash = await hash(password, 10);

    const result = await db.transaction(async (tx) => {
      const existingUser = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Email already exists");
      }

      const [user] = await tx
        .insert(usersTable)
        .values({ fullName, email, passwordHash })
        .returning();

      return user!;
    });

    if (result instanceof Error) {
      res.status(400).json({ error: result.message });
      return;
    }

    const token = jwt.sign({ userId: result.id }, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (error) {
    console.error("/signup", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body as LoginBody;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const validPassword = await compare(password, user.passwordHash);

    if (!validPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (error) {
    console.error("/login", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
