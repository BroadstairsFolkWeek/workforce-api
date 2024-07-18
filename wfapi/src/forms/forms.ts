import { Array, Data, Effect } from "effect";

import { ModelUserId } from "../model/interfaces/user-login";
import {
  getProfileByUserId,
  ProfileWithPhotoAndMetadata,
} from "../services/profiles";
import { ModelPersistedProfile } from "../model/interfaces/profile";
import {
  FormSpec,
  FormSpecId,
  FormSubmissionId,
  UnverifiedFormSubmission,
} from "./form";
import { FormProvider, FormSpecNotFound } from "./providers/form-provider";
import { verifyFormSubmission, verifyFormSubmissions } from "./form-validation";
import { addAvailableActions } from "./form-actions";

export class FormSubmissionNotFound extends Data.TaggedClass(
  "FormSubmissionNotFound"
) {}

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

const mergeSubmissionWithSpec =
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
