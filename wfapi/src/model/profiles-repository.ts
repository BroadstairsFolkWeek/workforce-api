import { Effect, Context } from "effect";
import {
  ModelAddableProfile,
  ModelPersistedProfile,
  ModelProfileId,
} from "./interfaces/profile";

export class ProfileNotFound {
  readonly _tag = "ProfileNotFound";
}

export class ProfilesRepository extends Context.Tag("ProfilesRepository")<
  ProfilesRepository,
  {
    readonly modelGetProfileByProfileId: (
      profileId: ModelProfileId
    ) => Effect.Effect<ModelPersistedProfile, ProfileNotFound>;
    readonly modelGetProfiles: () => Effect.Effect<ModelPersistedProfile[]>;
    readonly modelCreateProfile: (
      addableProfile: ModelAddableProfile
    ) => Effect.Effect<ModelPersistedProfile>;
  }
>() {}
