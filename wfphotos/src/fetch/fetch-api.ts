import { HttpClientError } from "@effect/platform/HttpClientError";
import { Context, Effect } from "effect";

export class FetchApi extends Context.Tag("FetchApi")<
  FetchApi,
  {
    readonly fetchGet: (
      url: string
    ) => Effect.Effect<ArrayBuffer, HttpClientError>;
  }
>() {}
