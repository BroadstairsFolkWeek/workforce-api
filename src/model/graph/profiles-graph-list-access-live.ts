import { Config, Effect, Layer } from "effect";
import { GraphClient } from "../../graph/graph-client";
import { ProfilesGraphListAccess } from "./profiles-graph-list-access";
import {
  createGraphListItem,
  getListItemsByFilter,
} from "./common-graph-list-access";
import {
  ModelEncodedAddableProfile,
  ModelEncodedPersistedProfile,
} from "../interfaces/profile";

// Any config error is unrecoverable.
const profilesListId = Config.string("WORKFORCE_PROFILES_LIST_GUID").pipe(
  Effect.orDie
);

export const profilesGraphListAccessLive = Layer.effect(
  ProfilesGraphListAccess,
  Effect.all([profilesListId, GraphClient]).pipe(
    Effect.map(([userLoginsListId, graphClient]) =>
      ProfilesGraphListAccess.of({
        getProfileGraphListItemsByFilter: (filter?: string) =>
          getListItemsByFilter(userLoginsListId)<ModelEncodedPersistedProfile>(
            filter
          ).pipe(Effect.provideService(GraphClient, graphClient)),

        createProfileGraphListItem: (fields: ModelEncodedAddableProfile) =>
          createGraphListItem(userLoginsListId)(fields).pipe(
            Effect.provideService(GraphClient, graphClient)
          ),
      })
    )
  )
);
