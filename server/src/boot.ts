import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { startScheduler } from "./lib/scheduler";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.get("/api/ping", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

if (env.isProduction) {
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);
} else {
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "Not Found" });
  });
}

const port = parseInt(process.env.PORT || "3001");
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
});

startScheduler();

export default app;
