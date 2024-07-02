import { Effect, Context } from "effect";
import { PersistedGraphListItem } from "../interfaces/graph/graph-list-items";
import {
  ModelEncodedAddableProfile,
  ModelEncodedPersistedProfile,
  ModelEncodedProfileUpdates,
} from "../interfaces/profile";

export class ProfilesGraphListAccess extends Context.Tag(
  "ProfilesGraphListAccess"
)<
  ProfilesGraphListAccess,
  {
    readonly getProfileGraphListItemsByFilter: (
      filter?: string
    ) => Effect.Effect<
      readonly PersistedGraphListItem<ModelEncodedPersistedProfile>[]
    >;

    readonly createProfileGraphListItem: (
      fields: ModelEncodedAddableProfile
    ) => Effect.Effect<PersistedGraphListItem<ModelEncodedPersistedProfile>>;

    readonly updateProfileGraphListItem: (
      listItemId: string
    ) => (
      updates: ModelEncodedProfileUpdates
    ) => Effect.Effect<ModelEncodedPersistedProfile>;
  }
>() {}
