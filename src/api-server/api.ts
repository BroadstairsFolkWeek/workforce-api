import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import profilesApi from "./profiles";

const api = new Hono().basePath("/api");

api.use(poweredBy());
api.use(logger());
api.use(prettyJSON());
api.use(secureHeaders());

api.get("/", (c) => {
  const headers = c.req.raw.headers;
  const headersObj = Object.fromEntries(headers.entries());
  return c.json(headersObj);
});

api.route("profiles", profilesApi);

export default api;
