import { Array, Data, Effect, Match } from "effect";
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
import { Profile } from "../interfaces/profile";

export class UnprocessableFormAction extends Data.TaggedClass(
  "UnprocessableFormAction"
) {}

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
  (profile: Profile) => (formSubmission: FormSubmissionWithSpecAndActions) =>
    FormProvider.pipe(
      Effect.andThen((provider) =>
        provider.updateFormSubmissionStatusByFormProviderSubmissionId(
          formSubmission.formProviderId,
          formSubmission.formProviderSubmissionId
        )(profile.id)(VerifiedFormSubmissionStatus.make("submitted"))
      ),
      Effect.andThen((submission) =>
        mergeSubmissionWithSpec(submission)(formSubmission.template)
      ),
      Effect.andThen(
        (unverifiedFormSubmission) =>
          new FormActionResultStatusUpdated({ unverifiedFormSubmission })
      )
    );

const doRetractAction =
  (profile: Profile) => (formSubmission: FormSubmissionWithSpecAndActions) =>
    FormProvider.pipe(
      Effect.andThen((provider) =>
        provider.updateFormSubmissionStatusByFormProviderSubmissionId(
          formSubmission.formProviderId,
          formSubmission.formProviderSubmissionId
        )(profile.id)(
          determineFormSubmissionStatusFollowingRetraction(profile)(
            formSubmission
          )
        )
      ),
      Effect.andThen((submission) =>
        mergeSubmissionWithSpec(submission)(formSubmission.template)
      ),
      Effect.andThen(
        (unverifiedFormSubmission) =>
          new FormActionResultStatusUpdated({ unverifiedFormSubmission })
      )
    );

export const applyActionToFormSubmission =
  (action: FormSubmissionAction) =>
  (profile: Profile) =>
  (formSubmission: FormSubmissionWithSpecAndActions) =>
    Effect.succeed(action)
      .pipe(
        Effect.when(() =>
          Array.contains(formSubmission.availableActions, action)
        ),
        Effect.andThen(
          Effect.catchTag("NoSuchElementException", () =>
            Effect.fail(new UnprocessableFormAction())
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
