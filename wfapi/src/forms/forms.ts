import { Array, Data, Effect, Match, pipe } from "effect";

import { ModelUserId } from "../model/interfaces/user-login";
import {
  getProfileByUserId,
  ProfileWithPhotoAndMetadata,
} from "../services/profiles";
import { ModelPersistedProfile } from "../model/interfaces/profile";
import {
  FormSpec,
  FormSpecId,
  FormSubmissionArchiveStatus,
  FormSubmissionAction,
  FormSubmissionId,
  FormSubmissionWithSpecAndActions,
  UnverifiedFormSubmission,
  UnverifiedFormSubmissionStatus,
  VerifiedFormSubmissionStatus,
} from "./form";
import { FormProvider, FormSpecNotFound } from "./providers/form-provider";
import {
  determineFormSubmissionStatusFollowingRetraction,
  isSubmissionStatusValidForFormSubmission,
  verifyFormSubmission,
  verifyFormSubmissions,
} from "./form-validation";
import {
  addAvailableActions,
  applyActionToFormSubmission,
  FormActionResult,
} from "./form-actions";
import { profile } from "console";

export class FormSubmissionNotFound extends Data.TaggedClass(
  "FormSubmissionNotFound"
) {}

export class InvalidFormSubmissionStatus extends Data.TaggedClass(
  "InvalidFormSubmissionStatus"
) {}

class ActionResultStatusUpdated extends Data.TaggedClass(
  "ActionResultStatusUpdated"
)<{ readonly formSubmission: FormSubmissionWithSpecAndActions }> {}

class ActionFormSubmissionDeleted extends Data.TaggedClass(
  "ActionFormSubmissionDeleted"
) {}

export type ActionFormResult = ActionResultStatusUpdated;

const getFormSpecsForFormSpecIds = (formSpecIds: Set<FormSpecId>) =>
  FormProvider.pipe(
    Effect.andThen((formProvider) =>
      Effect.forEach(formSpecIds, (formSpecId) =>
        formProvider.getFormSpec(formSpecId)
      )
    )
  );

const getFormSpecsForForms = (
  formSubmissions: readonly UnverifiedFormSubmission[]
) => {
  // Get the unique set of formSpecIds from the form submissions
  const formSpecIds = new Set(
    formSubmissions.map((formSubmission) => formSubmission.formSpecId)
  );
  return getFormSpecsForFormSpecIds(formSpecIds).pipe(
    Effect.catchTags({
      FormSpecNotFound: (e) =>
        Effect.dieMessage(
          `Data consistency error: FormSpec not found but is referenced by a FormSubmission: ${e.formSpecId}`
        ),
    })
  );
};

export const mergeSubmissionWithSpec =
  (formSubmission: UnverifiedFormSubmission) => (formSpec: FormSpec) => ({
    ...formSubmission,
    formSpec,
  });

const mergeSubmissionWithSpecs = (
  formSubmission: UnverifiedFormSubmission,
  formSpecs: readonly FormSpec[]
) =>
  Array.findFirst(
    formSpecs,
    (formSpec) => formSpec.id === formSubmission.formSpecId
  ).pipe(
    Effect.map(mergeSubmissionWithSpec(formSubmission)),
    Effect.catchTag("NoSuchElementException", () =>
      Effect.fail(
        new FormSpecNotFound({ formSpecId: formSubmission.formSpecId })
      )
    )
  );

const mergeSubmissionsWithSpecs = (
  formSubmissions: readonly UnverifiedFormSubmission[],
  formSpecs: readonly FormSpec[]
) =>
  Effect.forEach(formSubmissions, (formSubmission) =>
    mergeSubmissionWithSpecs(formSubmission, formSpecs)
  );

export const getFormsByProfile = (profile: ModelPersistedProfile) =>
  FormProvider.pipe(
    Effect.andThen((formProvider) =>
      formProvider.getActiveFormSubmissions(profile.profileId)
    ),
    Effect.andThen((formSubmissions) =>
      getFormSpecsForForms(formSubmissions).pipe(
        Effect.andThen((formSpecs) =>
          mergeSubmissionsWithSpecs(formSubmissions, formSpecs)
        ),
        Effect.andThen(verifyFormSubmissions(profile)),
        Effect.andThen(Array.map(addAvailableActions))
      )
    ),
    Effect.catchTags({
      FormSpecNotFound: (e) =>
        Effect.dieMessage(
          `Data consistency error: FormSpec not found but is referenced by a FormSubmission: ${e.formSpecId}`
        ),
    })
  );

export const getFormsByUserId = (userId: ModelUserId) =>
  getProfileByUserId(userId).pipe(
    Effect.andThen((profile) => getFormsByProfile(profile))
  );

const getFormForUserId = (
  userId: ModelUserId,
  formSubmissionId: FormSubmissionId
) =>
  getFormsByUserId(userId)
    .pipe(
      Effect.andThen(Array.findFirst((form) => form.id === formSubmissionId))
    )
    .pipe(
      Effect.catchTags({
        NoSuchElementException: () => Effect.fail(new FormSubmissionNotFound()),
      })
    );

const getFormSubmissionForProfile =
  (formSubmissionId: FormSubmissionId) => (profile: ModelPersistedProfile) =>
    getFormsByProfile(profile)
      .pipe(
        Effect.andThen(Array.findFirst((form) => form.id === formSubmissionId))
      )
      .pipe(
        Effect.catchTags({
          NoSuchElementException: () =>
            Effect.fail(new FormSubmissionNotFound()),
        })
      );

export const updateFormSubmissionForProfile =
  (formSubmissionId: FormSubmissionId) =>
  (answers: unknown) =>
  (profile: ProfileWithPhotoAndMetadata) =>
    getFormSubmissionForProfile(formSubmissionId)(profile).pipe(
      Effect.andThen((existingFormSubmission) =>
        FormProvider.pipe(
          Effect.andThen((formProvider) =>
            formProvider.updateFormSubmissionByFormProviderSubmissionId(
              existingFormSubmission.formProviderId,
              existingFormSubmission.formProviderSubmissionId
            )(profile.profileId)(
              existingFormSubmission.submissionStatus,
              answers
            )
          ),
          Effect.andThen((updatedFormSubmission) =>
            mergeSubmissionWithSpec(updatedFormSubmission)(
              existingFormSubmission.formSpec
            )
          ),
          Effect.andThen(verifyFormSubmission(profile)),
          Effect.andThen(addAvailableActions)
        )
      )
    );

export const updateFormSubmissionForUserId =
  (formSubmissionId: FormSubmissionId) =>
  (answers: unknown) =>
  (userId: ModelUserId) =>
    getProfileByUserId(userId).pipe(
      Effect.andThen(updateFormSubmissionForProfile(formSubmissionId)(answers))
    );

export const deleteFormSubmissionForProfile =
  (formSubmissionId: FormSubmissionId) =>
  (profile: ProfileWithPhotoAndMetadata) =>
    getFormSubmissionForProfile(formSubmissionId)(profile).pipe(
      Effect.andThen((formSubmission) =>
        FormProvider.pipe(
          Effect.andThen((provider) =>
            provider.deleteFormSubmissionByFormProviderSubmissionId(
              formSubmission.formProviderId,
              formSubmission.formProviderSubmissionId
            )
          )
        )
      )
    );

export const deleteFormSubmissionForUserId =
  (formSubmissionId: FormSubmissionId) => (userId: ModelUserId) =>
    getProfileByUserId(userId).pipe(
      Effect.andThen(deleteFormSubmissionForProfile(formSubmissionId))
    );

export const executeFormSubmissionActionForProfile =
  (formSubmissionId: FormSubmissionId) =>
  (action: FormSubmissionAction) =>
  (profile: ProfileWithPhotoAndMetadata) =>
    getFormSubmissionForProfile(formSubmissionId)(profile).pipe(
      Effect.andThen(applyActionToFormSubmission(action)(profile)),
      Effect.andThen(
        Match.type<FormActionResult>().pipe(
          Match.tag("FormActionResultStatusUpdated", (result) =>
            Effect.succeed(result.unverifiedFormSubmission).pipe(
              Effect.andThen(verifyFormSubmission(profile)),
              Effect.andThen(addAvailableActions),
              Effect.andThen(
                (verfiedFormSubmission) =>
                  new ActionResultStatusUpdated({
                    formSubmission: verfiedFormSubmission,
                  })
              )
            )
          ),
          Match.exhaustive
        )
      )
    );

export const executeFormSubmissionActionForUserId =
  (formSubmissionId: FormSubmissionId) =>
  (userId: ModelUserId) =>
  (action: FormSubmissionAction) =>
    getProfileByUserId(userId).pipe(
      Effect.andThen(
        executeFormSubmissionActionForProfile(formSubmissionId)(action)
      )
    );
