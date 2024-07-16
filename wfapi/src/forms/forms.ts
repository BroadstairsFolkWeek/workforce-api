import { Array, Effect } from "effect";

import { FormsAccess } from "./access/forms-access";
import { ModelUserId } from "../model/interfaces/user-login";
import { getProfileByUserId } from "../services/profiles";
import { ModelPersistedProfile } from "../model/interfaces/profile";
import {
  FormSpec,
  FormSpecId,
  UnverifiedFormSubmission,
  UnverifiedFormSubmissionWithSpec,
} from "./form";
import { FormSpecNotFound } from "./providers/form-provider";
import { verifyFormSubmissions } from "./form-validation";
import { addAvailableActions } from "./form-actions";

const getFormSpecsForFormSpecIds = (formSpecIds: Set<FormSpecId>) =>
  FormsAccess.pipe(
    Effect.andThen((formsAccess) =>
      Effect.forEach(formSpecIds, (formSpecId) =>
        formsAccess.getFormSpec(formSpecId)
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
  return getFormSpecsForFormSpecIds(formSpecIds);
};

const mergeSubmissionWithSpecs = (
  formSubmission: UnverifiedFormSubmission,
  formSpecs: readonly FormSpec[]
) =>
  Array.findFirst(
    formSpecs,
    (formSpec) => formSpec.id === formSubmission.formSpecId
  ).pipe(
    Effect.map((formSpec) => ({ ...formSubmission, formSpec })),
    Effect.catchTag("NoSuchElementException", () =>
      Effect.fail(new FormSpecNotFound(formSubmission.formSpecId))
    )
  );

const mergeSubmissionsWithSpecs = (
  formSubmissions: readonly UnverifiedFormSubmission[],
  formSpecs: readonly FormSpec[]
): Effect.Effect<UnverifiedFormSubmissionWithSpec[], FormSpecNotFound> =>
  Effect.forEach(formSubmissions, (formSubmission) =>
    mergeSubmissionWithSpecs(formSubmission, formSpecs)
  );

export const getFormsByProfile = (profile: ModelPersistedProfile) =>
  FormsAccess.pipe(
    Effect.andThen((formsAccess) =>
      formsAccess.getActiveFormSubmissions(profile.profileId)
    ),
    Effect.andThen((formSubmissions) =>
      getFormSpecsForForms(formSubmissions).pipe(
        Effect.andThen((formSpecs) =>
          mergeSubmissionsWithSpecs(formSubmissions, formSpecs)
        ),
        Effect.andThen(verifyFormSubmissions(profile)),
        Effect.andThen(Array.map(addAvailableActions))
      )
    )
  );

export const getFormsByUserId = (userId: ModelUserId) =>
  getProfileByUserId(userId).pipe(
    Effect.andThen((profile) => getFormsByProfile(profile))
  );
