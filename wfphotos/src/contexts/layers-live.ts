import { Layer } from "effect";
import { repositoriesLayerLive } from "./repositories-live";
import { fetchApiLive } from "../fetch/fetch-api-live";

export const layersLive = Layer.mergeAll(repositoriesLayerLive).pipe(
  Layer.provide(fetchApiLive)
);
