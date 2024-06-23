import * as photoServer from "./photo-server/server";

photoServer.startPhotoServer(3001);

process.on("SIGINT", () => {
  photoServer.stopPhotoServer();
});
process.on("SIGTERM", () => {
  photoServer.stopPhotoServer();
});
