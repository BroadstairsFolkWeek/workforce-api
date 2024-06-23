import { Effect, Context } from "effect";
import { PersistedGraphListItem } from "../interfaces/graph/graph-items";
import {
  ModelEncodedAddableProfile,
  ModelEncodedPersistedProfile,
} from "../interfaces/profile";

export class ProfilesGraphListAccess extends Context.Tag(
  "ProfilesGraphListAccess"
)<
  ProfilesGraphListAccess,
  {
    readonly getProfileGraphListItemsByFilter: (
      filter?: string
    ) => Effect.Effect<PersistedGraphListItem<ModelEncodedPersistedProfile>[]>;

    readonly createProfileGraphListItem: (
      fields: ModelEncodedAddableProfile
    ) => Effect.Effect<PersistedGraphListItem<ModelEncodedPersistedProfile>>;
  }
>() {}
