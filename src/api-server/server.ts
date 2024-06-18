import { serve } from "@hono/node-server";
import { ServerType } from "@hono/node-server/dist/types";
import api from "./api";

let server: ServerType | undefined;

export const serveRestApi = (port: number) => {
  server = serve({
    fetch: api.fetch,
    port,
  });

  console.log(`Server is running on port ${port}`);
};

export const stopRestApi = () => {
  if (server) {
    console.log("Stopping server...");
    server.close();
    server = undefined;
  }
};
