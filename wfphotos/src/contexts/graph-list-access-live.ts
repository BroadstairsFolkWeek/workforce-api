import { Layer } from "effect";
import { photosGraphListAccessLive } from "../model/graph/photos-graph-list-access-live";

export const graphListAccessesLive = Layer.mergeAll(photosGraphListAccessLive);
