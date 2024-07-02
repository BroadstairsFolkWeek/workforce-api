import { Layer } from "effect";
import { photosGraphAccessLive } from "../model/graph/photos-graph-access-live";

export const graphListAccessesLive = Layer.mergeAll(photosGraphAccessLive);
