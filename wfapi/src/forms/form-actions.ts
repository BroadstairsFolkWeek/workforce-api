import {
  FormSubmissionAvailableActions,
  FormSubmissionWithSpec,
  FormSubmissionWithSpecAndActions,
} from "./form";

export const addAvailableActions = (
  formSubmission: FormSubmissionWithSpec
): FormSubmissionWithSpecAndActions => {
  const actions: FormSubmissionAvailableActions[] = [];

  if (
    formSubmission.submissionStatus === "draft" ||
    formSubmission.submissionStatus === "submittable"
  ) {
    actions.push("save");
    actions.push("delete");
  }

  if (formSubmission.submissionStatus === "submittable") {
    actions.push("submit");
  }

  if (formSubmission.submissionStatus === "submitted") {
    actions.push("retract");
  }

  return { ...formSubmission, availableActions: actions };
};
