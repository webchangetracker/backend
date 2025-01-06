import express from "express";
import userRoutes from "./src/routes/user.routes.js";
import trackerRoutes from "./src/routes/tracker.routes.js";
import { authMiddleware } from "./src/middlewares/auth.middleware.js";
import { ENV } from "./env.js";

const app = express();

app.use(express.json());
app.use("/user", userRoutes);
app.use("/trackers", authMiddleware, trackerRoutes);

try {
  app.listen(ENV.PORT, () => {
    console.log(`Server is running on port ${ENV.PORT}`);
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
