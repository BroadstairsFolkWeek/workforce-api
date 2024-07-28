import { SurveyModel } from "survey-core";

import { ModelPersistedProfile } from "../model/interfaces/profile";
import {
  FormSubmissionWithSpec,
  UnverifiedFormSubmissionWithSpec,
  VerifiedFormSubmissionStatus,
} from "./form";
import { Schema } from "@effect/schema";
import { Effect } from "effect";

const isFormAnswersValid = (
  formSubmission: UnverifiedFormSubmissionWithSpec
): boolean => {
  const model = new SurveyModel(formSubmission.template.questions);
  model.data = formSubmission.answers;

  return model.validate(false, false);
};

const isProfileRequirementsMet = (
  profile: ModelPersistedProfile,
  profileRequirements: UnverifiedFormSubmissionWithSpec["template"]["requirements"]["profileRequirements"]
): boolean => {
  if (profileRequirements.firstName && !profile.givenName) {
    return false;
  }
  if (profileRequirements.surname && !profile.surname) {
    return false;
  }
  if (profileRequirements.displayName && !profile.displayName) {
    return false;
  }
  if (profileRequirements.address && !profile.address) {
    return false;
  }
  if (profileRequirements.telephone && !profile.telephone) {
    return false;
  }
  if (profileRequirements.email && !profile.email) {
    return false;
  }
  if (profileRequirements.photo && !(profile.photoIds || []).length) {
    return false;
  }

  return true;
};

const isRequirementsMet = (
  profile: ModelPersistedProfile,
  formSubmission: UnverifiedFormSubmissionWithSpec
): boolean => {
  return isProfileRequirementsMet(
    profile,
    formSubmission.template.requirements.profileRequirements
  );
};

/**
 * If the form's answers statisfy the validation rules, and if the form's requirements have been met,
 * then the form is submittable.
 */
const isFormSubmissionSubmittable =
  (profile: ModelPersistedProfile) =>
  (formSubmission: UnverifiedFormSubmissionWithSpec) =>
    isFormAnswersValid(formSubmission) &&
    isRequirementsMet(profile, formSubmission);

/**
 * Determine the permitted statuses for a form submission.
 */
const permittedFormSubmissionStatuses =
  (profile: ModelPersistedProfile) =>
  (
    formSubmission: UnverifiedFormSubmissionWithSpec
  ): VerifiedFormSubmissionStatus[] => {
    const retStatus: VerifiedFormSubmissionStatus[] = [];

    // The current status of the form submission is always a valid status.
    retStatus.push(
      VerifiedFormSubmissionStatus.make(formSubmission.submissionStatus)
    );

    // Forms can revert to draft or submittable from any other status as long as the form has not
    // already been accepted.
    if (formSubmission.submissionStatus !== "accepted") {
      if (isFormSubmissionSubmittable(profile)(formSubmission)) {
        retStatus.push(VerifiedFormSubmissionStatus.make("submittable"));
      } else {
        retStatus.push(VerifiedFormSubmissionStatus.make("draft"));
      }
    }

    return retStatus;
  };

export const isSubmissionStatusValidForFormSubmission =
  (status: VerifiedFormSubmissionStatus) =>
  (profile: ModelPersistedProfile) =>
  (formSubmission: UnverifiedFormSubmissionWithSpec): boolean => {
    return permittedFormSubmissionStatuses(profile)(formSubmission).some(
      (permittedStatus) => permittedStatus === status
    );
  };

export const determineFormSubmissionStatusFollowingRetraction =
  (profile: ModelPersistedProfile) =>
  (formSubmission: FormSubmissionWithSpec): VerifiedFormSubmissionStatus => {
    const permittedStatuses =
      permittedFormSubmissionStatuses(profile)(formSubmission);

    if (
      permittedStatuses.includes(
        VerifiedFormSubmissionStatus.make("submittable")
      )
    ) {
      return VerifiedFormSubmissionStatus.make("submittable");
    }

    if (
      permittedStatuses.includes(VerifiedFormSubmissionStatus.make("draft"))
    ) {
      return VerifiedFormSubmissionStatus.make("draft");
    }

    return formSubmission.submissionStatus;
  };

/**
 * Given a form submission, form spec, and user's Profile, determine the submission status of the form.
 */
export const determineFormSubmissionStatus =
  (profile: ModelPersistedProfile) =>
  (
    formSubmission: UnverifiedFormSubmissionWithSpec
  ): VerifiedFormSubmissionStatus => {
    // If the form has already reached the submitted or accepted state, keep it there.
    if (
      formSubmission.submissionStatus === "submitted" ||
      formSubmission.submissionStatus === "accepted"
    ) {
      return Schema.decodeSync(VerifiedFormSubmissionStatus)(
        formSubmission.submissionStatus
      );
    }

    // If the form's answers statisfy the validation rules, and if the form's requirements have been met, then the form is submittable.
    if (
      isFormAnswersValid(formSubmission) &&
      isRequirementsMet(profile, formSubmission)
    ) {
      return VerifiedFormSubmissionStatus.make("submittable");
    }

    return VerifiedFormSubmissionStatus.make("draft");
  };

const applyCrudStatusesToFormSubmission = (
  formSubmission: Omit<
    FormSubmissionWithSpec,
    "answersModifiable" | "submissionDeletable"
  >
): FormSubmissionWithSpec => {
  switch (formSubmission.submissionStatus) {
    case "draft":
    case "submittable":
      return {
        ...formSubmission,
        answersModifiable: "modifiable",
        submissionDeletable: "deletable",
      };

    case "submitted":
      return {
        ...formSubmission,
        answersModifiable: "locked",
        submissionDeletable: "deletable",
      };

    default:
      return {
        ...formSubmission,
        answersModifiable: "locked",
        submissionDeletable: "not-deletable",
      };
  }
};

/**
 * Takes a profile and an unverified form submission and returns a form submission with a verified submission status.
 *
 * Review the the submission against the form spec and update the submission if needed.
 *
 * Checks the form's answer's against the form specs validation rules.
 * Also checks if the form's requirements have been met.
 *
 * If both validation rules and requirements are met, then the form can be considered submittable,
 * assuming it has not already progressed to the submitted or accepted state.
 */
export const verifyFormSubmission =
  (profile: ModelPersistedProfile) =>
  (
    formSubmission: UnverifiedFormSubmissionWithSpec
  ): Effect.Effect<FormSubmissionWithSpec> => {
    return Effect.succeed({
      ...formSubmission,
      submissionStatus: determineFormSubmissionStatus(profile)(formSubmission),
    }).pipe(Effect.andThen(applyCrudStatusesToFormSubmission));
  };

export const verifyFormSubmissions =
  (profile: ModelPersistedProfile) =>
  (formSubmissions: readonly UnverifiedFormSubmissionWithSpec[]) =>
    Effect.forEach(formSubmissions, verifyFormSubmission(profile));
