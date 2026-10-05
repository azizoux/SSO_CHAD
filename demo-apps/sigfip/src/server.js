import app from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`SIGFIP Demo actif sur http://localhost:${config.port}`);
});
