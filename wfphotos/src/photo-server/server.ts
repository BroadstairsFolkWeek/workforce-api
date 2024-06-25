import { serve } from "@hono/node-server";
import { ServerType } from "@hono/node-server/dist/types";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import photos from "./photos";

let server: ServerType | undefined;

const hono = new Hono();

hono.use(logger());
hono.use(
  secureHeaders({
    crossOriginResourcePolicy: "cross-origin",
  })
);

hono.get("/", (c) => c.body(null, 204));
hono.route("/photos", photos);

export const startPhotoServer = (port: number) => {
  server = serve({
    fetch: hono.fetch,
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
