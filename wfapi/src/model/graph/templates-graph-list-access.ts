import { Effect, Context } from "effect";
import { PersistedGraphListItem } from "../interfaces/graph/graph-list-items";
import {
  ModelEncodedAddableTemplate,
  ModelEncodedPersistedTemplate,
  ModelEncodedTemplateUpdates,
} from "../interfaces/template";

export class TemplatesGraphListAccess extends Context.Tag(
  "TemplatesGraphListAccess"
)<
  TemplatesGraphListAccess,
  {
    readonly getTemplateGraphListItemsByFilter: (
      filter?: string
    ) => Effect.Effect<
      readonly PersistedGraphListItem<ModelEncodedPersistedTemplate>[]
    >;

    readonly createTemplateGraphListItem: (
      fields: ModelEncodedAddableTemplate
    ) => Effect.Effect<PersistedGraphListItem<ModelEncodedPersistedTemplate>>;

    readonly updateTemplateGraphListItem: (
      listItemId: string
    ) => (
      updates: ModelEncodedTemplateUpdates
    ) => Effect.Effect<ModelEncodedPersistedTemplate>;

    readonly deleteTemplateGraphListItem: (
      id: number
    ) => Effect.Effect<unknown>;
  }
>() {}
