import { Config, Effect, Layer } from "effect";
import { GraphClient } from "../../graph/graph-client";
import { ApplicationsGraphListAccess } from "./applications-graph-list-access";
import {
  ModelEncodedApplicationChanges,
  ModelEncodedPersistedApplication,
} from "../interfaces/application";
import {
  deleteGraphListItem,
  getListItemsByFilter,
  updateGraphListItemFields,
} from "./common-graph-list-access";

// Any config error is unrecoverable.
const applicationsListId = Config.string(
  "WORKFORCE_APPLICATIONS_LIST_GUID"
).pipe(Effect.orDie);

export const applicationsGraphListAccessLive = Layer.effect(
  ApplicationsGraphListAccess,
  Effect.all([applicationsListId, GraphClient]).pipe(
    Effect.map(([applicationsListId, graphClient]) =>
      ApplicationsGraphListAccess.of({
        getApplicationGraphListItemsByFilter: (filter?: string) =>
          getListItemsByFilter(
            applicationsListId
          )<ModelEncodedPersistedApplication>(filter).pipe(
            Effect.provideService(GraphClient, graphClient)
          ),

        updateApplicationGraphListItemFields: (
          id: number,
          changes: ModelEncodedApplicationChanges
        ) =>
          updateGraphListItemFields(
            applicationsListId
          )<ModelEncodedPersistedApplication>(id, changes).pipe(
            Effect.provideService(GraphClient, graphClient)
          ),

        deleteApplicationGraphListItem: (id: number) =>
          deleteGraphListItem(applicationsListId)(id).pipe(
            Effect.provideService(GraphClient, graphClient)
          ),
      })
    )
  )
);
