import { Config, Effect, Layer } from "effect";
import { GraphClient } from "../../graph/graph-client";
import {
  createGraphListItem,
  deleteGraphListItem,
  getListItemsByFilter,
  updateGraphListItemFields,
} from "./common-graph-list-access";
import { TemplatesGraphListAccess } from "./templates-graph-list-access";
import {
  ModelEncodedAddableTemplate,
  ModelEncodedPersistedTemplate,
  ModelEncodedTemplateUpdates,
} from "../interfaces/template";

// Any config error is unrecoverable.
const templatesListId = Config.string("WORKFORCE_TEMPLATES_LIST_GUID").pipe(
  Effect.orDie
);

export const templatesGraphListAccessLive = Layer.effect(
  TemplatesGraphListAccess,
  Effect.all([templatesListId, GraphClient]).pipe(
    Effect.map(([templatesListId, graphClient]) =>
      TemplatesGraphListAccess.of({
        getTemplateGraphListItemsByFilter: (filter?: string) =>
          getListItemsByFilter(templatesListId)<ModelEncodedPersistedTemplate>(
            filter
          ).pipe(Effect.provideService(GraphClient, graphClient)),

        createTemplateGraphListItem: (fields: ModelEncodedAddableTemplate) =>
          createGraphListItem(templatesListId)(fields).pipe(
            Effect.provideService(GraphClient, graphClient)
          ),

        updateTemplateGraphListItem:
          (listItemId: string) => (updates: ModelEncodedTemplateUpdates) =>
            updateGraphListItemFields(
              templatesListId
            )<ModelEncodedPersistedTemplate>(listItemId, updates).pipe(
              Effect.provideService(GraphClient, graphClient)
            ),

        deleteTemplateGraphListItem: (id: number) =>
          deleteGraphListItem(templatesListId)(id).pipe(
            Effect.provideService(GraphClient, graphClient)
          ),
      })
    )
  )
);
