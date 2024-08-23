import { Effect } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { getForms } from "../forms/forms";
import { runWfApiEffect } from "./effect-runner";
import { GetFormsResponse } from "./interfaces/forms";

const formsApi = new Hono();

formsApi.get("/", async (c) => {
  const program = getForms()
    .pipe(
      Effect.tap((forms) => Effect.logTrace(`Retrieved ${forms.length} forms`)),
      Effect.andThen((forms) => ({ data: forms })),
      Effect.andThen(S.encode(GetFormsResponse)),
      Effect.andThen((body) => c.json(body, 200))
    )
    .pipe(
      Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500)))
    );

  return runWfApiEffect(program);
});

export default formsApi;
