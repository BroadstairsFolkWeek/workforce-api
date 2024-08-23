import * as restApi from "./api-server/server";
import { runDataMigration } from "./migration/data.migration";

restApi.serveRestApi(3000);

process.on("SIGINT", () => {
  restApi.stopRestApi();
});
process.on("SIGTERM", () => {
  restApi.stopRestApi();
});

runDataMigration();
