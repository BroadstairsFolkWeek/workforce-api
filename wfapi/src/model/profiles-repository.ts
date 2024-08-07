import { Effect, Context, Data } from "effect";
import {
  ModelAddableProfile,
  ModelPersistedProfile,
  ModelProfileId,
  ModelProfileUpdates,
} from "./interfaces/profile";

export class ProfileNotFound extends Data.TaggedClass("ProfileNotFound")<{
  profileId: string;
}> {}

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

    readonly modelUpdateProfile: (
      profileId: ModelProfileId,
      updates: ModelProfileUpdates
    ) => Effect.Effect<ModelPersistedProfile, ProfileNotFound>;

    readonly modelDeleteProfileByProfileId: (
      profileId: ModelProfileId
    ) => Effect.Effect<ModelPersistedProfile, ProfileNotFound>;
  }
>() {}
