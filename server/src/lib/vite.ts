import express from "express";
import fs from "fs";
import path from "path";

export function serveStaticFiles(app: express.Express) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");

  app.use(express.static(distPath));

  app.use((req, res, next) => {
    const accept = req.headers.accept ?? "";
    if (typeof accept === "string" && !accept.includes("text/html")) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: "Not Found" });
    }
  });
}
