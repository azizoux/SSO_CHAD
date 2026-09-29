import dotenv from "dotenv";

import app from "./app.js";
import connectDatabase from "./config/database.js";

const PORT = process.env.PORT || 4000;
dotenv.config();

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log("");
    console.log("========================================");
    console.log("        CHAD SSO - Identity Server");
    console.log("========================================");
    console.log(`Environment : ${process.env.NODE_ENV}`);
    console.log(`Port        : ${PORT}`);
    console.log(`Health      : http://localhost:${PORT}/api/health`);
    console.log("========================================");
    console.log("");
  });
};

startServer();
