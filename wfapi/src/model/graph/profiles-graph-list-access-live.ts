import { Config, Effect, Layer } from "effect";
import { GraphClient } from "../../graph/graph-client";
import { ProfilesGraphListAccess } from "./profiles-graph-list-access";
import {
  createGraphListItem,
  deleteGraphListItem,
  getListItemsByFilter,
  updateGraphListItemFields,
} from "./common-graph-list-access";
import {
  ModelEncodedAddableProfile,
  ModelEncodedPersistedProfile,
  ModelEncodedProfileUpdates,
} from "../interfaces/profile";

// Any config error is unrecoverable.
const profilesListId = Config.string("WORKFORCE_PROFILES_LIST_GUID").pipe(
  Effect.orDie
);

export const profilesGraphListAccessLive = Layer.effect(
  ProfilesGraphListAccess,
  Effect.all([profilesListId, GraphClient]).pipe(
    Effect.map(([profilesListId, graphClient]) =>
      ProfilesGraphListAccess.of({
        getProfileGraphListItemsByFilter: (filter?: string) =>
          getListItemsByFilter(profilesListId)<ModelEncodedPersistedProfile>(
            filter
          ).pipe(Effect.provideService(GraphClient, graphClient)),

        createProfileGraphListItem: (fields: ModelEncodedAddableProfile) =>
          createGraphListItem(profilesListId)(fields).pipe(
            Effect.provideService(GraphClient, graphClient)
          ),

        updateProfileGraphListItem:
          (listItemId: string) => (updates: ModelEncodedProfileUpdates) =>
            updateGraphListItemFields(
              profilesListId
            )<ModelEncodedPersistedProfile>(listItemId, updates).pipe(
              Effect.provideService(GraphClient, graphClient)
            ),

        deleteProfileGraphListItem: (id: number) =>
          deleteGraphListItem(profilesListId)(id).pipe(
            Effect.provideService(GraphClient, graphClient)
          ),
      })
    )
  )
);
