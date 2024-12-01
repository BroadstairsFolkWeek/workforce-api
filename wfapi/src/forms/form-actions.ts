import { Array, Data, Effect, Match } from "effect";
import {
  FormSubmissionAction,
  FormSubmissionWithSpec,
  FormSubmissionWithSpecAndActions,
  OtherDataRequirements,
  UnverifiedFormSubmissionWithSpec,
  VerifiedFormSubmissionStatus,
} from "../interfaces/form";
import { determineFormSubmissionStatusFollowingRetraction } from "./form-validation";
import { FormsRepository } from "../model/forms-repository";
import { mergeSubmissionWithSpec } from "./forms";
import { Profile } from "../interfaces/profile";

export class UnprocessableFormAction extends Data.TaggedClass(
  "UnprocessableFormAction"
) {}

class FormActionResultStatusUpdated extends Data.TaggedClass(
  "FormActionResultStatusUpdated"
)<{ readonly unverifiedFormSubmission: UnverifiedFormSubmissionWithSpec }> {}

export type FormActionResult = FormActionResultStatusUpdated;

export const getAvailableFormActions = (
  formSubmission: FormSubmissionWithSpec
): FormSubmissionAction[] => {
  const actions: FormSubmissionAction[] = [];

  if (formSubmission.submissionStatus === "submittable") {
    actions.push("submit");
  }

  if (formSubmission.submissionStatus === "submitted") {
    actions.push("retract");
  }

  return actions;
};

export const addAvailableActions = <T extends FormSubmissionWithSpec>(
  formSubmission: T
) => {
  return {
    ...formSubmission,
    availableActions: getAvailableFormActions(formSubmission),
  };
};

const getOtherProfileData =
  (profile: Profile) =>
  (profileRequirements: OtherDataRequirements["profileRequirements"]) => {
    let retVal: any = {};
    profileRequirements.forEach((requirement) => {
      const data = (profile as any)[requirement];
      if (data) {
        retVal[requirement] = data;
      }
    });

    return retVal;
  };

const getOtherProfilePhotoData =
  (profile: Profile) =>
  (photoRequired: OtherDataRequirements["profilePhotoRequired"]) => {
    let retVal: any = {};
    if (photoRequired) {
      const data = profile.metadata.photoId;
      if (data) {
        retVal.photoId = data;
      }
    }

    return retVal;
  };

export const getOtherData =
  (profile: Profile) => (formSubmission: FormSubmissionWithSpec) => {
    const templateRequirements = formSubmission.template.otherDataRequirements;

    return {
      profileData: getOtherProfileData(profile)(
        templateRequirements.profileRequirements
      ),
      profilePhotoData: getOtherProfilePhotoData(profile)(
        templateRequirements.profilePhotoRequired
      ),
    };
  };

const doSubmitAction =
  (profile: Profile) => (formSubmission: FormSubmissionWithSpecAndActions) =>
    FormsRepository.pipe(
      Effect.andThen((provider) =>
        provider.updateFormSubmissionStatusByFormProviderSubmissionId(
          formSubmission.formProviderId,
          formSubmission.formProviderSubmissionId
        )(profile.id)(
          VerifiedFormSubmissionStatus.make("submitted"),
          getOtherData(profile)(formSubmission)
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

const doRetractAction =
  (profile: Profile) => (formSubmission: FormSubmissionWithSpecAndActions) =>
    FormsRepository.pipe(
      Effect.andThen((provider) =>
        provider.updateFormSubmissionStatusByFormProviderSubmissionId(
          formSubmission.formProviderId,
          formSubmission.formProviderSubmissionId
        )(profile.id)(
          determineFormSubmissionStatusFollowingRetraction(profile)(
            formSubmission
          ),
          formSubmission.otherData
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
