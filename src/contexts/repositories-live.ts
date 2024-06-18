import { Layer } from "effect";
import { userLoginRepositoryLive } from "../model/user-logins-repository-graph";
import { profilesRepositoryLive } from "../model/profiles-repository-graph";
import { graphListAccessesLive } from "./graph-list-access-live";
import { defaultGraphClient } from "../graph/default-graph-client";

export const repositoriesLayerLive = Layer.mergeAll(
  userLoginRepositoryLive,
  profilesRepositoryLive
).pipe(Layer.provide(graphListAccessesLive), Layer.provide(defaultGraphClient));
