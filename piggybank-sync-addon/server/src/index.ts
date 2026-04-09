import express from "express";
import { getDb } from "./db";
import { performSync } from "./merge";
import { advertise } from "./mdns";

const PORT = parseInt(process.env.PORT || "3456", 10);

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.post("/sync", (req, res) => {
  try {
    const result = performSync(req.body);
    res.json(result);
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: "Sync failed" });
  }
});

getDb();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Piggy Bank Sync server listening on port ${PORT}`);
  advertise(PORT);
});
