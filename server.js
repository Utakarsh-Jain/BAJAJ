const port = Number(process.env.PORT) || 3000;
import { createApp } from "./src/app.js";

const app = createApp();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
