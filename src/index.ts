import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Effect, Console } from "effect";

// dummy comment

const getName = () => Effect.succeed("World2");

const greet = (name: string) => Effect.succeed(`Hello, ${name}!`);

const program = getName().pipe(
  Effect.andThen(greet),
  Effect.andThen((greeting) => Console.log(greeting))
);

Effect.runSync(program);

const app = new Hono();

app.get("/", (c) => {
  const headers = c.req.raw.headers;
  const headersObj = Object.fromEntries(headers.entries());
  return c.json(headersObj);
});

const port = 3000;
serve({
  fetch: app.fetch,
  port,
});

console.log(`Server is running on port ${port}`);
