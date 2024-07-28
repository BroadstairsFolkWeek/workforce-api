/**
 * Special case handlers to present the Workforce Application Form as a standard form.
 * This is a temporary solution until the Workforce Application Form is updated to be a standard form.
 *
 * Special handling is required as the current Workforce Application Form submissions are stored as items in a SharePoint list rather
 * than as generic data files. Further, the schema of the WF Application form's questions is hard-coded, rather than read from a data source.
 */

import { Array, Context, Effect, Layer, pipe } from "effect";
import { ModelProfileId } from "../../../model/interfaces/profile";
import { ApplicationsRepository } from "../../../model/applications-repository";
import { Schema as S } from "@effect/schema";
import {
  ModelAgeGroup,
  ModelApplicationStatus,
  ModelCoreApplication,
  ModelPersistedApplication,
  ModelTShirtSize,
} from "../../../model/interfaces/application";
import { ParseError } from "@effect/schema/ParseResult";
import { FormSpecNotFound } from "../form-provider";
import {
  workforceApplicationFormSpec,
  workforceApplicationFormSpecId,
} from "./wf-application-form-spec";
import {
  FormProviderId,
  FormProviderSubmissionId,
  Template,
  TemplateId,
  FormSubmissionId,
  UnverifiedFormSubmission,
  VerifiedFormSubmissionStatus,
} from "../../form";
import { WfApplicationFormProvider } from "./wf-application-form-provider";
import { FormSubmissionNotFound } from "../../forms";

const DaysAvailableDay = S.Literal(
  "day1",
  "day2",
  "day3",
  "day4",
  "day5",
  "day6",
  "day7",
  "day8"
);
type DaysAvailableDay = S.Schema.Type<typeof DaysAvailableDay>;

const ApplicationFormAnswers = S.Struct({
  daysAvailable: S.Array(DaysAvailableDay),
  ageGroup: S.optional(ModelAgeGroup),
  emergencyContactName: S.optional(S.String),
  emergencyContactTelephone: S.optional(S.String),
  previousVolunteer: S.optional(S.Boolean),
  previousTeam: S.optional(S.String),
  teamPreference1: S.optional(S.String),
  teamPreference2: S.optional(S.String),
  teamPreference3: S.optional(S.String),
  dbsDisclosureNumber: S.optional(S.String),
  dbsDisclosureDate: S.optional(S.String),
  constraints: S.optional(S.String),
  personsPreference: S.optional(S.String),
  firstAidCertificate: S.optional(S.Boolean),
  occupationOrSkills: S.optional(S.String),
  camping: S.optional(S.Boolean),
  tShirtSize: S.optional(ModelTShirtSize),
  otherInformation: S.optional(S.String),
  acceptedTermsAndConditions: S.optional(S.Boolean),
  whatsApp: S.optional(S.Boolean),
  consentNewlifeWills: S.optional(S.Boolean),
  newlifeHaveWillInPlace: S.optional(S.Boolean),
  newlifeHavePoaInPlace: S.optional(S.Boolean),
  newlifeWantFreeReview: S.optional(S.Boolean),
  version: S.Number,
});

const CreatableApplicationFormAnswers = ApplicationFormAnswers.pipe(
  S.omit("version", "daysAvailable"),
  S.extend(
    S.Struct({
      daysAvailable: S.optionalWith(S.Array(DaysAvailableDay), {
        default: () => [],
      }),
    })
  )
);

interface ApplicationFormAnswers
  extends S.Schema.Type<typeof ApplicationFormAnswers> {}

const asIsoDate = (date: string) => new Date(date).toISOString().split("T")[0];

const modelApplicationToApplicationFormAnswers = (
  modelApplication: ModelPersistedApplication
): Effect.Effect<ApplicationFormAnswers, ParseError> => {
  const transformed = {
    ...modelApplication,
    daysAvailable: Array.filter(S.is(DaysAvailableDay))([
      modelApplication.availableFirstFriday ? "day1" : undefined,
      modelApplication.availableSaturday ? "day2" : undefined,
      modelApplication.availableSunday ? "day3" : undefined,
      modelApplication.availableMonday ? "day4" : undefined,
      modelApplication.availableTuesday ? "day5" : undefined,
      modelApplication.availableWednesday ? "day6" : undefined,
      modelApplication.availableThursday ? "day7" : undefined,
      modelApplication.availableLastFriday ? "day8" : undefined,
    ]),
    dbsDisclosureDate: modelApplication.dbsDisclosureDate
      ? asIsoDate(modelApplication.dbsDisclosureDate)
      : undefined,
  };

  return S.decode(ApplicationFormAnswers)(transformed);
};

const determineApplicationStatus = (
  status: VerifiedFormSubmissionStatus
): ModelApplicationStatus => {
  switch (status) {
    case "draft":
      return "info-required";
    case "submittable":
      return "ready-to-submit";
    case "submitted":
      return "submitted";
    case "accepted":
      return "complete";
    default:
      return "info-required";
  }
};

const applicationAnswersToModelApplicationChanges =
  (status: VerifiedFormSubmissionStatus) =>
  (applicationAnswers: ApplicationFormAnswers): ModelCoreApplication => {
    return {
      ...applicationAnswers,
      availableFirstFriday: Array.contains(
        applicationAnswers.daysAvailable,
        "day1"
      ),
      availableSaturday: Array.contains(
        applicationAnswers.daysAvailable,
        "day2"
      ),
      availableSunday: Array.contains(applicationAnswers.daysAvailable, "day3"),
      availableMonday: Array.contains(applicationAnswers.daysAvailable, "day4"),
      availableTuesday: Array.contains(
        applicationAnswers.daysAvailable,
        "day5"
      ),
      availableWednesday: Array.contains(
        applicationAnswers.daysAvailable,
        "day6"
      ),
      availableThursday: Array.contains(
        applicationAnswers.daysAvailable,
        "day7"
      ),
      availableLastFriday: Array.contains(
        applicationAnswers.daysAvailable,
        "day8"
      ),
      status: determineApplicationStatus(status),
      acceptedTermsAndConditions:
        applicationAnswers.acceptedTermsAndConditions ?? false,
      consentNewlifeWills: applicationAnswers.consentNewlifeWills ?? false,
      newlifeHaveWillInPlace:
        applicationAnswers.newlifeHaveWillInPlace ?? false,
      newlifeHavePoaInPlace: applicationAnswers.newlifeHavePoaInPlace ?? false,
      newlifeWantFreeReview: applicationAnswers.newlifeWantFreeReview ?? false,
      whatsApp: applicationAnswers.whatsApp ?? false,
      title: "Workforce Application",
    };
  };

const updatedAnswersToModelApplicationChanges = (
  updatedAnswers: unknown,
  status: VerifiedFormSubmissionStatus
) =>
  S.decodeUnknown(ApplicationFormAnswers)(updatedAnswers)
    .pipe(Effect.andThen(applicationAnswersToModelApplicationChanges(status)))
    .pipe(Effect.catchTag("ParseError", (e) => Effect.die(e)));

const getFormAnswersFromApplication = (
  application: ModelPersistedApplication
): Effect.Effect<ApplicationFormAnswers> =>
  modelApplicationToApplicationFormAnswers(application).pipe(
    Effect.catchTag("ParseError", (e) => Effect.die(e))
  );

const getSubmissionStatusFromApplication = (
  application: ModelPersistedApplication
): UnverifiedFormSubmission["submissionStatus"] => {
  switch (application.status) {
    case "ready-to-submit":
      return "submittable";
    case "submitted":
      return "submitted";
    case "complete":
      return "accepted";
    default:
      return "draft";
  }
};

const getFormSubmissionForApplication =
  (profileId: ModelProfileId) =>
  (
    application: ModelPersistedApplication
  ): Effect.Effect<UnverifiedFormSubmission> =>
    Effect.all({
      formProviderId: Effect.succeed(
        FormProviderId.make("wf-application-form-provider")
      ),
      formProviderSubmissionId: Effect.succeed(
        FormProviderSubmissionId.make(application.applicationId)
      ),
      id: Effect.succeed(FormSubmissionId.make(application.applicationId)),
      templateId: Effect.succeed(workforceApplicationFormSpecId),
      profileId: Effect.succeed(profileId),
      answers: getFormAnswersFromApplication(application),
      submissionStatus: Effect.succeed(
        getSubmissionStatusFromApplication(application)
      ),
      archiveStatus: Effect.succeed("active" as const),
      createdDateTimeUtc: Effect.succeed(application.createdDate),
      modifiedDateTimeUtc: Effect.succeed(new Date(application.lastSaved)),
    });

const getApplicationFormForProfileId =
  (applicationsRepo: Context.Tag.Service<ApplicationsRepository>) =>
  (profileId: ModelProfileId) =>
    applicationsRepo
      .modelGetApplicationByProfileId(profileId)
      .pipe(Effect.andThen(getFormSubmissionForApplication(profileId)));

const getActiveFormSubmissions =
  (applicationsRepo: Context.Tag.Service<ApplicationsRepository>) =>
  (profileId: ModelProfileId) =>
    getApplicationFormForProfileId(applicationsRepo)(profileId).pipe(
      Effect.map((form) => [form]),
      Effect.andThen(Array.filter((form) => form.archiveStatus == "active")),
      Effect.catchTag("ApplicationNotFound", () =>
        Effect.succeed([] as readonly UnverifiedFormSubmission[])
      )
    );

const getFormSpec = (formSpecId: TemplateId) =>
  formSpecId === workforceApplicationFormSpecId
    ? Effect.succeed(workforceApplicationFormSpec)
    : Effect.fail(new FormSpecNotFound({ formSpecId }));

const getCreatableFormSpecs =
  (applicationsRepo: Context.Tag.Service<ApplicationsRepository>) =>
  (profileId: ModelProfileId) =>
    getApplicationFormForProfileId(applicationsRepo)(profileId).pipe(
      Effect.andThen(() => [] as Template[]),
      Effect.catchTag("ApplicationNotFound", () =>
        Effect.succeed([workforceApplicationFormSpec])
      )
    );

const getCreatableFormSpec =
  (applicationsRepo: Context.Tag.Service<ApplicationsRepository>) =>
  (profileId: ModelProfileId) =>
  (formSpecId: TemplateId) =>
    getCreatableFormSpecs(applicationsRepo)(profileId).pipe(
      Effect.andThen(Array.filter((formSpec) => formSpec.id === formSpecId)),
      Effect.andThen(Array.head),
      Effect.catchTag("NoSuchElementException", () =>
        Effect.fail(new FormSpecNotFound({ formSpecId }))
      )
    );

const createFormSubmission =
  (applicationsRepo: Context.Tag.Service<ApplicationsRepository>) =>
  (profileId: ModelProfileId) =>
  (formSpecId: TemplateId, answers: unknown) =>
    S.decodeUnknown(CreatableApplicationFormAnswers)(answers)
      .pipe(
        Effect.andThen((addableApplicationAnswers) =>
          applicationAnswersToModelApplicationChanges(
            VerifiedFormSubmissionStatus.make("draft")
          )({
            ...addableApplicationAnswers,
            version: 1,
            daysAvailable: addableApplicationAnswers.daysAvailable ?? [],
          })
        ),
        Effect.andThen((applicationChanges) =>
          applicationsRepo.modelCreateApplication(profileId)(applicationChanges)
        ),
        Effect.andThen(getFormSubmissionForApplication(profileId))
      )
      .pipe(
        Effect.catchTags({
          ParseError: (e) => Effect.die(e),
        })
      );

const updateFormSubmissionByFormProviderSubmissionId =
  (applicationsRepo: Context.Tag.Service<ApplicationsRepository>) =>
  (
    formProviderId: FormProviderId,
    formProviderSubmissionId: FormProviderSubmissionId
  ) =>
  (profileId: ModelProfileId) =>
  (formSubmissionStatus: VerifiedFormSubmissionStatus, answers: unknown) => {
    return S.decodeUnknown(ApplicationFormAnswers)(answers)
      .pipe(
        Effect.andThen((applicationAnswers) =>
          pipe(
            applicationAnswersToModelApplicationChanges(formSubmissionStatus)(
              applicationAnswers
            ),
            applicationsRepo.modelSaveApplicationChanges(
              formProviderSubmissionId
            )(applicationAnswers.version)
          )
        )
      )
      .pipe(Effect.andThen(getFormSubmissionForApplication(profileId)))
      .pipe(
        Effect.catchTags({
          ParseError: (e) => Effect.die(e),
          ApplicationNotFound: () => Effect.fail(new FormSubmissionNotFound()),
          RepositoryConflictError: () => Effect.die("RepositoryConflictError"),
        })
      );
  };

const updateFormSubmissionStatusByFormProviderSubmissionId =
  (applicationsRepo: Context.Tag.Service<ApplicationsRepository>) =>
  (
    formProviderId: FormProviderId,
    formProviderSubmissionId: FormProviderSubmissionId
  ) =>
  (profileId: ModelProfileId) =>
  (formSubmissionStatus: VerifiedFormSubmissionStatus) =>
    applicationsRepo
      .modelSaveApplicationStatus(formProviderSubmissionId)(
        determineApplicationStatus(formSubmissionStatus)
      )
      .pipe(Effect.andThen(getFormSubmissionForApplication(profileId)))
      .pipe(
        Effect.catchTags({
          ApplicationNotFound: () => Effect.fail(new FormSubmissionNotFound()),
        })
      );

const deleteFormSubmissionByFormProviderSubmissionId =
  (applicationsRepo: Context.Tag.Service<ApplicationsRepository>) =>
  (
    formProviderId: FormProviderId,
    formProviderSubmissionId: FormProviderSubmissionId
  ) =>
    applicationsRepo
      .modelDeleteApplicationByApplicationId(formProviderSubmissionId)
      .pipe(
        Effect.catchTags({
          ApplicationNotFound: () => Effect.fail(new FormSubmissionNotFound()),
        })
      );

export const wfApplicationFormProviderLive = Layer.effect(
  WfApplicationFormProvider,
  Effect.all([ApplicationsRepository]).pipe(
    Effect.andThen(([applicationsRepository]) =>
      WfApplicationFormProvider.of({
        createFormSubmission: createFormSubmission(applicationsRepository),

        getActiveFormSubmissions: getActiveFormSubmissions(
          applicationsRepository
        ),

        getFormSpec,

        getCreatableFormSpecs: getCreatableFormSpecs(applicationsRepository),

        getCreatableFormSpec: getCreatableFormSpec(applicationsRepository),

        updateFormSubmissionByFormProviderSubmissionId:
          updateFormSubmissionByFormProviderSubmissionId(
            applicationsRepository
          ),

        updateFormSubmissionStatusByFormProviderSubmissionId:
          updateFormSubmissionStatusByFormProviderSubmissionId(
            applicationsRepository
          ),

        deleteFormSubmissionByFormProviderSubmissionId:
          deleteFormSubmissionByFormProviderSubmissionId(
            applicationsRepository
          ),
      })
    )
  )
);
