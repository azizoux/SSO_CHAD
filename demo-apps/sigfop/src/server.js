import app from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`SIGFOP Demo actif sur http://localhost:${config.port}`);
});
