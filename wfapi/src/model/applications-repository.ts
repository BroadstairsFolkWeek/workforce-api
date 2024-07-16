import { Effect, Context } from "effect";
import { ModelProfileId } from "./interfaces/profile";
import {
  ModelApplicationChanges,
  ModelPersistedApplication,
} from "./interfaces/application";
import { RepositoryConflictError } from "./repository-errors";

export class ApplicationNotFound {
  readonly _tag = "ApplicationNotFound";
}

export class ApplicationsRepository extends Context.Tag(
  "ApplicationsRepository"
)<
  ApplicationsRepository,
  {
    readonly modelGetApplicationByProfileId: (
      profileId: ModelProfileId
    ) => Effect.Effect<ModelPersistedApplication, ApplicationNotFound>;

    readonly modelSaveApplicationChanges: (
      applicationId: string
    ) => (
      applyToVersion: number
    ) => (
      changes: ModelApplicationChanges
    ) => Effect.Effect<
      ModelPersistedApplication,
      ApplicationNotFound | RepositoryConflictError
    >;
  }
>() {}