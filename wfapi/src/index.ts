import * as restApi from "./api-server/server";

restApi.serveRestApi(3000);

process.on("SIGINT", () => {
  restApi.stopRestApi();
});
process.on("SIGTERM", () => {
  restApi.stopRestApi();
});
