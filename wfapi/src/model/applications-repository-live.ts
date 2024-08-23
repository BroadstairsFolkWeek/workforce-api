import { Array, Context, Effect, Layer } from "effect";
import { Schema } from "@effect/schema";
import { v4 as uuidv4 } from "uuid";
import {
  ModelAddableApplication,
  ModelApplicationChanges,
  ModelApplicationChangesVersioned,
  ModelApplicationStatus,
  ModelCoreApplication,
  ModelPersistedApplication,
} from "./interfaces/application";
import {
  ApplicationNotFound,
  ApplicationsRepository,
} from "./applications-repository";
import { PersistedGraphListItemFields } from "./interfaces/graph/graph-list-items";
import { ApplicationsGraphListAccess } from "./graph/applications-graph-list-access";
import { RepositoryConflictError } from "./repository-errors";
import { ModelProfileId } from "./interfaces/profile";

type ListAccessService = Context.Tag.Service<ApplicationsGraphListAccess>;

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

const modelGetApplicationsByFilter =
  (listAccess: ListAccessService) => (filter?: string) =>
    listAccess.getApplicationGraphListItemsByFilter(filter).pipe(
      Effect.andThen(Array.map((item) => item.fields)),
      Effect.andThen(Array.map((fields) => fieldsToApplication(fields))),
      Effect.andThen(Effect.all),
      // Parse errors of data from Graph/SharePoint are considered unrecoverable.
      Effect.catchTag("ParseError", (e) => Effect.die(e))
    );

const modelGetApplicationByFilter =
  (listAccess: ListAccessService) => (filter: string) =>
    modelGetApplicationsByFilter(listAccess)(filter).pipe(
      Effect.head,
      Effect.catchTag("NoSuchElementException", () =>
        Effect.fail(new ApplicationNotFound())
      )
    );

const getApplications = (listAccess: ListAccessService) => () => {
  return modelGetApplicationsByFilter(listAccess)();
};

const getApplicationByProfileId =
  (listAccess: ListAccessService) => (profileId: string) => {
    return modelGetApplicationByFilter(listAccess)(
      `fields/ProfileId eq '${profileId}'`
    );
  };

const getApplicationByApplicationId =
  (listAccess: ListAccessService) => (applicationId: string) => {
    return modelGetApplicationByFilter(listAccess)(
      `fields/ApplicationId eq '${applicationId}'`
    );
  };

const coreToAddableApplication =
  (profileId: string) =>
  (application: ModelCoreApplication): ModelAddableApplication => {
    return {
      ...application,
      applicationId: uuidv4(),
      profileId: ModelProfileId.make(profileId),
      version: 1,
    };
  };

const createApplication =
  (listAccess: ListAccessService) =>
  (profileId: string) =>
  (fields: ModelCoreApplication) =>
    Effect.succeed(fields)
      .pipe(
        Effect.andThen(coreToAddableApplication(profileId)),
        Effect.andThen(Schema.encode(ModelAddableApplication)),
        Effect.andThen((addableApplication) =>
          listAccess.createApplicationGraphListItem(addableApplication)
        ),
        Effect.andThen((item) => item.fields),
        Effect.andThen(fieldsToApplication)
      )
      .pipe(
        // Parse errors of data from Graph/SharePoint are considered unrecoverable.
        Effect.catchTag("ParseError", (e) => Effect.die(e))
      );

const saveApplicationChanges =
  (listAccess: ListAccessService) =>
  (applicationId: string) =>
  (applyToVersion: number) =>
  (changes: ModelApplicationChanges) => {
    const dbIdAndConflictCheck = getApplicationByApplicationId(listAccess)(
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

    return Effect.all([dbIdAndConflictCheck, changedFields]).pipe(
      Effect.flatMap(([dbId, fields]) =>
        listAccess.updateApplicationGraphListItemFields(dbId, fields)
      ),
      Effect.flatMap((fields) => fieldsToApplication(fields)),
      // Parse errors of data from Graph/SharePoint are considered unrecoverable.
      Effect.catchTag("ParseError", (e) => Effect.die(e))
    );
  };

const saveApplicationStatus =
  (listAccess: ListAccessService) =>
  (applicationId: string) =>
  (status: ModelApplicationStatus, otherData: string) =>
    getApplicationByApplicationId(listAccess)(applicationId).pipe(
      Effect.map((application) => application.dbId),
      Effect.andThen((dbId) =>
        listAccess.updateApplicationGraphListItemFields(dbId, {
          Status: status,
          OtherData: otherData,
        })
      ),
      Effect.andThen(fieldsToApplication),
      // Parse errors of data from Graph/SharePoint are considered unrecoverable.
      Effect.catchTag("ParseError", (e) => Effect.die(e))
    );

const deleteApplicationByApplicationId =
  (listAccess: ListAccessService) => (applicationId: string) =>
    getApplicationByApplicationId(listAccess)(applicationId).pipe(
      Effect.andThen((application) => application.dbId),
      Effect.andThen((dbId) => listAccess.deleteApplicationGraphListItem(dbId))
    );

export const applicationsRepositoryLive = Layer.effect(
  ApplicationsRepository,
  ApplicationsGraphListAccess.pipe(
    Effect.map((service) => ({
      modelCreateApplication: createApplication(service),

      modelGetApplications: getApplications(service),

      modelGetApplicationByProfileId: getApplicationByProfileId(service),

      modelGetApplicationByApplicationId:
        getApplicationByApplicationId(service),

      modelSaveApplicationChanges: saveApplicationChanges(service),

      modelDeleteApplicationByApplicationId:
        deleteApplicationByApplicationId(service),

      modelSaveApplicationStatus: saveApplicationStatus(service),
    }))
  )
);
