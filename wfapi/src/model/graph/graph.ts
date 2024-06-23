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

export const graphRequestPatchOrDie = (gr: GraphRequest) => (body: unknown) =>
  Effect.tryPromise({
    try: () => gr.patch(body),
    catch: (e) => wrapIfGraphError(e),
  }).pipe(
    Effect.catchAll((e) =>
      e instanceof GraphClientGraphError ? Effect.fail(e) : Effect.die(e)
    )
  );

export const graphRequestPost = (gr: GraphRequest) => (body: unknown) =>
  Effect.tryPromise({
    try: () => gr.post(body),
    catch: (e) => wrapIfGraphError(e),
  });

export const graphRequestPostOrDie = (gr: GraphRequest) => (body: unknown) =>
  graphRequestPost(gr)(body).pipe(
    Effect.catchAll((e) =>
      e instanceof GraphClientGraphError ? Effect.fail(e) : Effect.die(e)
    )
  );

export const graphRequestDelete = (gr: GraphRequest) =>
  Effect.tryPromise({
    try: () => gr.delete(),
    catch: (e) => wrapIfGraphError(e),
  });

export const graphRequestDeleteOrDie = (gr: GraphRequest) =>
  graphRequestDelete(gr).pipe(
    Effect.catchAll((e) =>
      e instanceof GraphClientGraphError ? Effect.fail(e) : Effect.die(e)
    )
  );
