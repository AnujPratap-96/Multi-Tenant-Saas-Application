import { env } from "./src/config/env.js";
import app from "./src/app.js";
import { connectDB } from "./src/lib/db.js";
import { redisClient } from "./src/config/redis.js";
import { startWorkers, stopWorkers } from "./src/modules/queue/services/queue.service.js";
import { setupGracefulShutdown, setHttpServer, registerShutdownHandler } from "./src/lib/shutdown.js";

const ok = (label) => console.log("BOOT-OK:", label);

const main = async () => {
  await connectDB();
  ok("db connected");
  await redisClient.connect();
  ok("redis connected");
  startWorkers();
  const server = app.listen(env.PORT, () => ok(`listening on ${env.PORT}`));
  setHttpServer(server);
  registerShutdownHandler(() => redisClient.quit());
  registerShutdownHandler(stopWorkers);
  setupGracefulShutdown();
  setTimeout(() => {
    ok("smoke complete");
    server.close();
    process.exit(0);
  }, 2500);
};

main().catch((err) => {
  console.error("BOOT-FAIL:", err);
  process.exit(1);
});