import { Array, Data, Effect, Match } from "effect";
import { ModelPersistedProfile } from "../model/interfaces/profile";
import {
  FormSubmissionAction,
  FormSubmissionWithSpec,
  FormSubmissionWithSpecAndActions,
  UnverifiedFormSubmissionWithSpec,
  VerifiedFormSubmissionStatus,
} from "./form";
import { determineFormSubmissionStatusFollowingRetraction } from "./form-validation";
import { FormProvider } from "./providers/form-provider";
import { mergeSubmissionWithSpec } from "./forms";

export class InvalidFormAction extends Data.TaggedClass("InvalidFormAction") {}

class FormActionResultStatusUpdated extends Data.TaggedClass(
  "FormActionResultStatusUpdated"
)<{ readonly unverifiedFormSubmission: UnverifiedFormSubmissionWithSpec }> {}

export type FormActionResult = FormActionResultStatusUpdated;

export const addAvailableActions = (
  formSubmission: FormSubmissionWithSpec
): FormSubmissionWithSpecAndActions => {
  const actions: FormSubmissionAction[] = [];

  if (formSubmission.submissionStatus === "submittable") {
    actions.push("submit");
  }

  if (formSubmission.submissionStatus === "submitted") {
    actions.push("retract");
  }

  return { ...formSubmission, availableActions: actions };
};

const doSubmitAction =
  (profile: ModelPersistedProfile) =>
  (formSubmission: FormSubmissionWithSpecAndActions) =>
    FormProvider.pipe(
      Effect.andThen((provider) =>
        provider.updateFormSubmissionStatusByFormProviderSubmissionId(
          formSubmission.formProviderId,
          formSubmission.formProviderSubmissionId
        )(profile.profileId)(VerifiedFormSubmissionStatus.make("submitted"))
      ),
      Effect.andThen((submission) =>
        mergeSubmissionWithSpec(submission)(formSubmission.formSpec)
      ),
      Effect.andThen(
        (unverifiedFormSubmission) =>
          new FormActionResultStatusUpdated({ unverifiedFormSubmission })
      )
    );

const doRetractAction =
  (profile: ModelPersistedProfile) =>
  (formSubmission: FormSubmissionWithSpecAndActions) =>
    FormProvider.pipe(
      Effect.andThen((provider) =>
        provider.updateFormSubmissionStatusByFormProviderSubmissionId(
          formSubmission.formProviderId,
          formSubmission.formProviderSubmissionId
        )(profile.profileId)(
          determineFormSubmissionStatusFollowingRetraction(profile)(
            formSubmission
          )
        )
      ),
      Effect.andThen((submission) =>
        mergeSubmissionWithSpec(submission)(formSubmission.formSpec)
      ),
      Effect.andThen(
        (unverifiedFormSubmission) =>
          new FormActionResultStatusUpdated({ unverifiedFormSubmission })
      )
    );

export const applyActionToFormSubmission =
  (action: FormSubmissionAction) =>
  (profile: ModelPersistedProfile) =>
  (formSubmission: FormSubmissionWithSpecAndActions) =>
    Effect.succeed(action)
      .pipe(
        Effect.when(() =>
          Array.contains(formSubmission.availableActions, action)
        ),
        Effect.andThen(
          Effect.catchTag("NoSuchElementException", () =>
            Effect.fail(new InvalidFormAction())
          )
        )
      )
      .pipe(
        Effect.andThen(
          Match.type<FormSubmissionAction>().pipe(
            Match.when("submit", (action) =>
              doSubmitAction(profile)(formSubmission)
            ),
            Match.when("retract", (action) =>
              doRetractAction(profile)(formSubmission)
            ),
            Match.exhaustive
          )
        )
      );
