import express from "express";
import { db } from "../db/index.js";
import { trackersTable } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { validateBody } from "../utils/zod.utils.js";
import puppeteer, { Browser } from "puppeteer";

const trackerSchema = z.object({
  name: z.string().min(1).max(255),
  cronExpr: z.string().min(1).max(255),
  compareMode: z.enum(["innerText", "innerHtml"]),
  websiteUrl: z.string().url().max(255),
  selector: z.string().min(1).max(255),
});
type TrackerBody = z.infer<typeof trackerSchema>;

const testTrackerSchema = z.object({
  websiteUrl: z.string().url().max(255),
  selector: z.string().min(1).max(255),
  compareMode: z.enum(["innerText", "innerHtml"]),
});
type TestTrackerBody = z.infer<typeof testTrackerSchema>;

const router = express.Router();

router.post(
  "/",
  validateBody(trackerSchema),
  async (req: express.Request, res: express.Response) => {
    const userId = req.user.id;
    const body = req.body as TrackerBody;

    try {
      const tracker = await db
        .insert(trackersTable)
        .values({
          ...body,
          userId,
        })
        .returning();

      res.json(tracker[0]);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/", async (req: express.Request, res: express.Response) => {
  const userId = req.user.id;

  try {
    const trackers = await db
      .select()
      .from(trackersTable)
      .where(eq(trackersTable.userId, userId));

    res.json(trackers);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: express.Request, res: express.Response) => {
  const userId = req.user.id;
  const trackerId = Number(req.params.id);

  try {
    const tracker = await db
      .select()
      .from(trackersTable)
      .where(
        and(eq(trackersTable.id, trackerId), eq(trackersTable.userId, userId))
      );

    if (!tracker.length) {
      res.status(404).json({ message: "Tracker not found" });
      return;
    }

    res.json(tracker[0]);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put(
  "/:id",
  validateBody(trackerSchema),
  async (req: express.Request, res: express.Response) => {
    const userId = req.user.id;
    const trackerId = Number(req.params.id);
    const body = req.body as TrackerBody;

    try {
      const updated = await db
        .update(trackersTable)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(
          and(eq(trackersTable.id, trackerId), eq(trackersTable.userId, userId))
        )
        .returning();

      if (!updated.length) {
        res.status(404).json({ message: "Tracker not found" });
        return;
      }

      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete("/:id", async (req: express.Request, res: express.Response) => {
  const userId = req.user.id;
  const trackerId = Number(req.params.id);

  try {
    const deleted = await db
      .delete(trackersTable)
      .where(
        and(eq(trackersTable.id, trackerId), eq(trackersTable.userId, userId))
      )
      .returning();

    if (!deleted.length) {
      res.status(404).json({ message: "Tracker not found" });
      return;
    }

    res.json({ message: "Tracker deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post(
  "/test",
  validateBody(testTrackerSchema),
  async (req: express.Request, res: express.Response) => {
    const { websiteUrl, selector, compareMode } = req.body as TestTrackerBody;

    let browser: Browser | undefined;
    try {
      browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(websiteUrl);
      await page.setViewport({ width: 1512, height: 823 });

      const testSelector = await page.locator(selector).waitHandle();
      const testResult = (
        compareMode === "innerHtml"
          ? await testSelector?.evaluate((el: any) => el.innerHTML)
          : await testSelector?.evaluate((el: any) => el.innerText)
      ) as string | undefined;

      res.json({ result: testResult });
    } catch (error) {
      console.error("/tracker/test", error);
      res.status(500).json({ message: "Internal server error" });
    } finally {
      await browser?.close();
    }
  }
);

export default router;
