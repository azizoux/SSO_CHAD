import express from "express";
import session from "express-session";

import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "./config.js";
import authRoutes from "./routes/auth.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const sessionStore = new session.MemoryStore();

app.locals.sessionStore = sessionStore;

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan((tokens, req, res) => {
    return [
      tokens.method(req, res),
      req.path,
      tokens.status(req, res),
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  }),
);

app.use(
  session({
    name: "sigfip.sid",
    secret: config.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

const publicDir = path.resolve(__dirname, "../public");

app.use(express.static(publicDir));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "SIGFIP-DEMO",
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/home.html");
  }

  return res.redirect("/login.html");
});

app.use("/auth", authRoutes);

export default app;
