import { Effect, Layer } from "effect";
import { Schema } from "@effect/schema";
import {
  ModelApplicationChanges,
  ModelApplicationChangesVersioned,
  ModelApplicationStatus,
  ModelPersistedApplication,
} from "./interfaces/application";
import {
  ApplicationNotFound,
  ApplicationsRepository,
} from "./applications-repository";
import { PersistedGraphListItemFields } from "./interfaces/graph/graph-list-items";
import { ApplicationsGraphListAccess } from "./graph/applications-graph-list-access";
import { RepositoryConflictError } from "./repository-errors";

const fieldsToApplication = (fields: PersistedGraphListItemFields) => {
  // Apply defaults for any missing fields.
  const itemWithDefaults = {
    ConsentNewlifeWills: false,
    NewlifeHaveWillInPlace: false,
    NewlifeHavePoaInPlace: false,
    NewlifeWantFreeReview: false,
    ...fields,
  };

  return Schema.decodeUnknown(ModelPersistedApplication)(itemWithDefaults);
};

const modelGetApplicationByFilter = (filter: string) => {
  return ApplicationsGraphListAccess.pipe(
    Effect.flatMap((listAccess) =>
      listAccess.getApplicationGraphListItemsByFilter(filter)
    ),
    Effect.head,
    Effect.catchTag("NoSuchElementException", () =>
      Effect.fail(new ApplicationNotFound())
    ),
    Effect.map((item) => item.fields),
    Effect.flatMap((fields) => fieldsToApplication(fields)),
    // Parse errors of data from Graph/SharePoint are considered unrecoverable.
    Effect.catchTag("ParseError", (e) => Effect.die(e))
  );
};

const modelGetApplicationByProfileId = (profileId: string) => {
  return modelGetApplicationByFilter(`fields/ProfileId eq '${profileId}'`);
};

const modelGetApplicationByApplicationId = (applicationId: string) => {
  return modelGetApplicationByFilter(
    `fields/ApplicationId eq '${applicationId}'`
  );
};

const modelSaveApplicationChanges =
  (applicationId: string) =>
  (applyToVersion: number) =>
  (changes: ModelApplicationChanges) => {
    const dbIdAndConflictCheck = modelGetApplicationByApplicationId(
      applicationId
    ).pipe(
      Effect.flatMap((application) =>
        application.version === applyToVersion
          ? Effect.succeed(application)
          : Effect.fail(new RepositoryConflictError())
      ),
      Effect.map((application) => application.dbId)
    );

    const changedFields = Schema.encode(ModelApplicationChangesVersioned)({
      ...changes,
      version: applyToVersion + 1,
    });

    return Effect.all([
      dbIdAndConflictCheck,
      changedFields,
      ApplicationsGraphListAccess,
    ]).pipe(
      Effect.flatMap(([dbId, fields, listAccess]) =>
        listAccess.updateApplicationGraphListItemFields(dbId, fields)
      ),
      Effect.flatMap((fields) => fieldsToApplication(fields)),
      // Parse errors of data from Graph/SharePoint are considered unrecoverable.
      Effect.catchTag("ParseError", (e) => Effect.die(e))
    );
  };

const modelSaveApplicationStatus =
  (applicationId: string) => (status: ModelApplicationStatus) => {
    return modelGetApplicationByApplicationId(applicationId).pipe(
      Effect.map((application) => application.dbId),
      Effect.andThen((dbId) =>
        ApplicationsGraphListAccess.pipe(
          Effect.andThen((listAccess) =>
            listAccess.updateApplicationGraphListItemFields(dbId, {
              Status: status,
            })
          ),
          Effect.andThen(fieldsToApplication),
          // Parse errors of data from Graph/SharePoint are considered unrecoverable.
          Effect.catchTag("ParseError", (e) => Effect.die(e))
        )
      )
    );
  };

const modelDeleteApplicationByApplicationId = (applicationId: string) =>
  ApplicationsGraphListAccess.pipe(
    Effect.andThen((listAccess) =>
      modelGetApplicationByApplicationId(applicationId).pipe(
        Effect.andThen((application) => application.dbId),
        Effect.andThen((dbId) =>
          listAccess.deleteApplicationGraphListItem(dbId)
        )
      )
    )
  );

export const applicationsRepositoryLive = Layer.effect(
  ApplicationsRepository,
  ApplicationsGraphListAccess.pipe(
    Effect.map((service) => ({
      modelGetApplicationByProfileId: (profileId: string) =>
        modelGetApplicationByProfileId(profileId).pipe(
          Effect.provideService(ApplicationsGraphListAccess, service)
        ),

      modelGetApplicationByApplicationId: (applicationId: string) =>
        modelGetApplicationByApplicationId(applicationId).pipe(
          Effect.provideService(ApplicationsGraphListAccess, service)
        ),

      modelSaveApplicationChanges:
        (applicationId: string) =>
        (applyToVersion: number) =>
        (changes: ModelApplicationChanges) =>
          modelSaveApplicationChanges(applicationId)(applyToVersion)(
            changes
          ).pipe(Effect.provideService(ApplicationsGraphListAccess, service)),

      modelDeleteApplicationByApplicationId: (applicationId: string) =>
        modelDeleteApplicationByApplicationId(applicationId).pipe(
          Effect.provideService(ApplicationsGraphListAccess, service)
        ),

      modelSaveApplicationStatus:
        (applicationId: string) => (status: ModelApplicationStatus) =>
          modelSaveApplicationStatus(applicationId)(status).pipe(
            Effect.provideService(ApplicationsGraphListAccess, service)
          ),
    }))
  )
);
