import { Layer } from "effect";
import { userLoginRepositoryLive } from "../model/user-logins-repository-graph";
import { profilesRepositoryLive } from "../model/profiles-repository-graph";
import { graphListAccessesLive } from "./graph-list-access-live";
import { defaultGraphClient } from "../graph/default-graph-client";
import { photosRepositoryLive } from "../model/photos-repository-live";
import { templatesRepositoryLive } from "../model/templates-repository-live";

export const repositoriesLayerLive = Layer.mergeAll(
  userLoginRepositoryLive,
  profilesRepositoryLive,
  photosRepositoryLive,
  templatesRepositoryLive
).pipe(Layer.provide(graphListAccessesLive), Layer.provide(defaultGraphClient));
