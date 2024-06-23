import { Layer } from "effect";
import { graphListAccessesLive } from "./graph-list-access-live";
import { defaultGraphClient } from "../graph/default-graph-client";
import { photosRepositoryLive } from "../model/photos-repository-live";

export const repositoriesLayerLive = Layer.mergeAll(photosRepositoryLive).pipe(
  Layer.provide(graphListAccessesLive),
  Layer.provide(defaultGraphClient)
);
