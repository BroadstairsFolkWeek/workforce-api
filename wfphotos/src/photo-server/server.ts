import { serve } from "@hono/node-server";
import { ServerType } from "@hono/node-server/dist/types";
import photos from "./photos";

let server: ServerType | undefined;

export const startPhotoServer = (port: number) => {
  server = serve({
    fetch: photos.fetch,
    port,
  });

  console.log(`Server is running on port ${port}`);
};

export const stopPhotoServer = () => {
  if (server) {
    console.log("Stopping server...");
    server.close();
    server = undefined;
  }
};
