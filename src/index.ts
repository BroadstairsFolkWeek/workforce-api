import * as restApi from "./rest-api";

restApi.serveRestApi(3000);

process.on("SIGINT", () => {
  restApi.stopRestApi();
});
process.on("SIGTERM", () => {
  restApi.stopRestApi();
});
