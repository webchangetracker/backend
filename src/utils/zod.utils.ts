import z from "zod";
import express from "express";

export const validateBody =
  (schema: z.ZodSchema) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  };
