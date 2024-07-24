import { Effect, Context } from "effect";
import {
  ModelEncodedAddableApplication,
  ModelEncodedApplicationChanges,
  ModelEncodedPersistedApplication,
} from "../interfaces/application";
import { PersistedGraphListItem } from "../interfaces/graph/graph-list-items";

export class ApplicationsGraphListAccess extends Context.Tag(
  "ApplicationsGraphListAccess"
)<
  ApplicationsGraphListAccess,
  {
    readonly createApplicationGraphListItem: (
      application: ModelEncodedAddableApplication
    ) => Effect.Effect<
      PersistedGraphListItem<ModelEncodedPersistedApplication>
    >;

    readonly getApplicationGraphListItemsByFilter: (
      filter?: string
    ) => Effect.Effect<
      readonly PersistedGraphListItem<ModelEncodedPersistedApplication>[]
    >;

    readonly updateApplicationGraphListItemFields: (
      id: number,
      changes: ModelEncodedApplicationChanges
    ) => Effect.Effect<ModelEncodedPersistedApplication>;

    readonly deleteApplicationGraphListItem: (
      id: number
    ) => Effect.Effect<unknown>;
  }
>() {}
