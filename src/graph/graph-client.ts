import { Effect, Context } from "effect";
import { Client } from "@microsoft/microsoft-graph-client";

export class GraphClient extends Context.Tag("GraphClient")<
  GraphClient,
  {
    readonly client: Effect.Effect<Client>;
  }
>() {}
