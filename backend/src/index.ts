import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { config } from "./lib/config";
import { authRouter } from "./routes/auth";
import { apiKeysRouter } from "./routes/apiKeys";
import { aiRouter } from "./routes/ai";
import { resultsRouter } from "./routes/results";
import { pagesRouter } from "./routes/pages";

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(cookieParser());

// The web dashboard and the extension both call these JSON APIs.
app.use(authRouter);
app.use(apiKeysRouter);
app.use(aiRouter);
app.use(resultsRouter);

// Server-rendered pages (login, signup, dashboard, extension connect).
app.use(pagesRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`K.AI Labs backend listening on http://localhost:${config.port}`);
});
