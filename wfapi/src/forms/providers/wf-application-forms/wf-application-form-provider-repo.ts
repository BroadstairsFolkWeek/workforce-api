/**
 * Special case handlers to present the Workforce Application Form as a standard form.
 * This is a temporary solution until the Workforce Application Form is updated to be a standard form.
 *
 * Special handling is required as the current Workforce Application Form submissions are stored as items in a SharePoint list rather
 * than as generic data files. Further, the schema of the WF Application form's questions is hard-coded, rather than read from a data source.
 */

import { Array, Effect, Layer } from "effect";
import { ModelProfileId } from "../../../model/interfaces/profile";
import { ApplicationsRepository } from "../../../model/applications-repository";
import { Schema as S } from "@effect/schema";
import {
  ModelAgeGroup,
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
  FormSpecId,
  FormSubmissionId,
  UnverifiedFormSubmission,
} from "../../form";
import { WfApplicationFormProvider } from "./wf-application-form-provider";

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
  emergencyContactPhone: S.optional(S.String),
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
  consentNewlifeWills: S.optional(S.Boolean),
  newlifeHaveWillInPlace: S.optional(S.Boolean),
  newlifeHavePoaInPlace: S.optional(S.Boolean),
  newlifeWantFreeReview: S.optional(S.Boolean),
});

interface ApplicationFormAnswers
  extends S.Schema.Type<typeof ApplicationFormAnswers> {}

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
  };

  return S.decode(ApplicationFormAnswers)(transformed);
};

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
      id: Effect.succeed(FormSubmissionId.make(application.applicationId)),
      formSpecId: Effect.succeed(workforceApplicationFormSpecId),
      profileId: Effect.succeed(profileId),
      answers: getFormAnswersFromApplication(application),
      submissionStatus: Effect.succeed(
        getSubmissionStatusFromApplication(application)
      ),
      archiveStatus: Effect.succeed("active" as const),
    });

const getApplicationFormForProfileId = (profileId: ModelProfileId) =>
  ApplicationsRepository.pipe(
    Effect.andThen((applicationsRepo) =>
      applicationsRepo
        .modelGetApplicationByProfileId(profileId)
        .pipe(Effect.andThen(getFormSubmissionForApplication(profileId)))
    )
  );

const getActiveFormSubmissions = (
  profileId: ModelProfileId
): Effect.Effect<
  readonly UnverifiedFormSubmission[],
  never,
  ApplicationsRepository
> =>
  getApplicationFormForProfileId(profileId).pipe(
    Effect.map((form) => [form]),
    Effect.andThen(Array.filter((form) => form.archiveStatus == "active")),
    Effect.catchTag("ApplicationNotFound", () =>
      Effect.succeed([] as readonly UnverifiedFormSubmission[])
    )
  );

const getFormSpec = (formSpecId: FormSpecId) =>
  formSpecId === workforceApplicationFormSpecId
    ? Effect.succeed(workforceApplicationFormSpec)
    : Effect.fail(new FormSpecNotFound(formSpecId));

const getCreatableFormSpecs = (profileId: ModelProfileId) =>
  getApplicationFormForProfileId(profileId).pipe(
    Effect.andThen(() => []),
    Effect.catchTag("ApplicationNotFound", () =>
      Effect.succeed([workforceApplicationFormSpec])
    )
  );

export const wfApplicationsFormProviderLive = Layer.effect(
  WfApplicationFormProvider,
  ApplicationsRepository.pipe(
    Effect.andThen((applicationsRepo) =>
      Effect.succeed({
        getActiveFormSubmissions: (profileId: ModelProfileId) =>
          getActiveFormSubmissions(profileId).pipe(
            Effect.provideService(ApplicationsRepository, applicationsRepo)
          ),

        getFormSpec,

        getCreatableFormSpecs: (profileId: ModelProfileId) =>
          getCreatableFormSpecs(profileId).pipe(
            Effect.provideService(ApplicationsRepository, applicationsRepo)
          ),
      })
    )
  )
);
