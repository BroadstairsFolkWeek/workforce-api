import { Effect, HashMap } from "effect";
import { Schema } from "@effect/schema";
import { SurveyModel } from "survey-core";

import {
  FormSubmissionWithSpec,
  UnverifiedFormSubmissionWithSpec,
  VerifiedFormSubmissionStatus,
} from "./form";
import { Profile, WithProfile } from "../interfaces/profile";

const isFormAnswersValid = (
  formSubmission: UnverifiedFormSubmissionWithSpec
): boolean => {
  const model = new SurveyModel(formSubmission.template.questions);
  model.data = formSubmission.answers;

  return model.validate(false, false);
};

const isProfileRequirementMet = (
  profile: Profile,
  profileRequirement: string
): boolean => {
  if (profileRequirement in profile) {
    return !!profile[profileRequirement as keyof Profile];
  } else {
    return false;
  }
};

const isProfileRequirementsMet = (
  profile: Profile,
  profileRequirements: UnverifiedFormSubmissionWithSpec["template"]["otherDataRequirements"]["profileRequirements"]
): boolean =>
  profileRequirements.every((profileRequirement) =>
    isProfileRequirementMet(profile, profileRequirement)
  );

const isProfilePhotoRequirementsMet = (
  profile: Profile,
  photoRequired: UnverifiedFormSubmissionWithSpec["template"]["otherDataRequirements"]["profilePhotoRequired"]
): boolean => {
  if (photoRequired) {
    return !!profile.metadata.photoId;
  } else {
    return true;
  }
};

const isRequirementsMet = (
  profile: Profile,
  formSubmission: UnverifiedFormSubmissionWithSpec
): boolean => {
  return (
    isProfileRequirementsMet(
      profile,
      formSubmission.template.otherDataRequirements.profileRequirements
    ) &&
    isProfilePhotoRequirementsMet(
      profile,
      formSubmission.template.otherDataRequirements.profilePhotoRequired
    )
  );
};

/**
 * If the form's answers statisfy the validation rules, and if the form's requirements have been met,
 * then the form is submittable.
 */
const isFormSubmissionSubmittable =
  (profile: Profile) => (formSubmission: UnverifiedFormSubmissionWithSpec) =>
    isFormAnswersValid(formSubmission) &&
    isRequirementsMet(profile, formSubmission);

/**
 * Determine the permitted statuses for a form submission.
 */
const permittedFormSubmissionStatuses =
  (profile: Profile) =>
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
  (profile: Profile) =>
  (formSubmission: UnverifiedFormSubmissionWithSpec): boolean => {
    return permittedFormSubmissionStatuses(profile)(formSubmission).some(
      (permittedStatus) => permittedStatus === status
    );
  };

export const determineFormSubmissionStatusFollowingRetraction =
  (profile: Profile) =>
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
  (profile: Profile) =>
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

const getCrudStatusesForSubmissionStatus = (
  submissionStatus: FormSubmissionWithSpec["submissionStatus"]
): {
  answersModifiable: FormSubmissionWithSpec["answersModifiable"];
  submissionDeletable: FormSubmissionWithSpec["submissionDeletable"];
} => {
  switch (submissionStatus) {
    case "draft":
    case "submittable":
      return {
        answersModifiable: "modifiable",
        submissionDeletable: "deletable",
      };

    case "submitted":
      return {
        answersModifiable: "locked",
        submissionDeletable: "deletable",
      };

    default:
      return {
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
export const verifyFormSubmissionAgainstProfile =
  (profile: Profile) => (formSubmission: UnverifiedFormSubmissionWithSpec) => {
    const submissionStatus =
      determineFormSubmissionStatus(profile)(formSubmission);

    return Effect.succeed({
      ...formSubmission,
      submissionStatus,
      ...getCrudStatusesForSubmissionStatus(submissionStatus),
      profile,
    });
  };

export const verifyFormSubmissionsAgainstProfile =
  (profile: Profile) =>
  (formSubmissions: readonly UnverifiedFormSubmissionWithSpec[]) =>
    Effect.forEach(
      formSubmissions,
      verifyFormSubmissionAgainstProfile(profile)
    );

export const verifyFormsAgainstProfiles = (
  forms: readonly (UnverifiedFormSubmissionWithSpec & WithProfile)[]
) =>
  Effect.forEach(forms, (form) =>
    verifyFormSubmissionAgainstProfile(form.profile)(form)
  );
