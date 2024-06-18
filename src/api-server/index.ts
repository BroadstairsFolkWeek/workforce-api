import { serve } from "@hono/node-server";
import { ServerType } from "@hono/node-server/dist/types";
import { Hono } from "hono";

const app = new Hono();
let server: ServerType | undefined;

app.get("/", (c) => {
  const headers = c.req.raw.headers;
  const headersObj = Object.fromEntries(headers.entries());
  return c.json(headersObj);
});

export const serveRestApi = (port: number) => {
  server = serve({
    fetch: app.fetch,
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
