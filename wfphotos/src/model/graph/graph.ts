import { Effect } from "effect";
import { GraphRequest } from "@microsoft/microsoft-graph-client";
import {
  GraphClientGraphError,
  wrapIfGraphError,
} from "../interfaces/graph/graph-error";
import { GraphClient } from "../../graph/graph-client";

export const getGraphClient = () =>
  GraphClient.pipe(Effect.flatMap((gc) => gc.client));

export const graphRequestGet = (gr: GraphRequest) =>
  Effect.tryPromise({
    try: () => gr.get(),
    catch: (e) => wrapIfGraphError(e),
  });

export const graphRequestGetOrDie = (gr: GraphRequest) =>
  graphRequestGet(gr).pipe(
    Effect.catchAll((e) =>
      e instanceof GraphClientGraphError ? Effect.fail(e) : Effect.die(e)
    )
  );
