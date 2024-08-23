import { Effect, Context } from "effect";
import { ModelProfileId } from "./interfaces/profile";
import {
  ModelApplicationChanges,
  ModelApplicationStatus,
  ModelCoreApplication,
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
    readonly modelGetApplications: () => Effect.Effect<
      ModelPersistedApplication[]
    >;

    readonly modelGetApplicationByProfileId: (
      profileId: ModelProfileId
    ) => Effect.Effect<ModelPersistedApplication, ApplicationNotFound>;

    readonly modelCreateApplication: (
      profileId: string
    ) => (
      fields: ModelCoreApplication
    ) => Effect.Effect<ModelPersistedApplication, never>;

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

    readonly modelSaveApplicationStatus: (
      applicationId: string
    ) => (
      status: ModelApplicationStatus,
      otherData: string
    ) => Effect.Effect<ModelPersistedApplication, ApplicationNotFound>;

    readonly modelDeleteApplicationByApplicationId: (
      applicationId: string
    ) => Effect.Effect<unknown, ApplicationNotFound>;
  }
>() {}
