import { Template, TemplateId } from "../../interfaces/form";

// Hardcoded survey specification representing the Workforce Application Form for 2024.
import applicationFormQuestionsModel from "./wf-application-form-questions.json";

export const workforceApplicationFormSpecId = TemplateId.make(
  "e590cd86-f639-4211-9520-90330a04559a"
);

export const workforceApplicationFormSpec: Template = {
  id: workforceApplicationFormSpecId,
  version: 1,
  shortName: "WF 2024",
  fullName: "Workforce Application Form 2024",
  description: "Workforce Application Form for BFW 2024.",
  questions: applicationFormQuestionsModel,
  otherDataRequirements: {
    profileRequirements: [
      "givenName",
      "surname",
      "displayName",
      "address",
      "telephone",
      "email",
    ],
    profilePhotoRequired: true,
  },
  constraints: {
    maxFormsPerProfile: 1,
  },
  listItemLayout: {
    _tag: "Group",
    orientation: "horizontal",
    items: [
      {
        _tag: "OtherDataProfile",
        profileRequirement: "givenName",
      },
      {
        _tag: "OtherDataProfile",
        profileRequirement: "surname",
      },
    ],
  },
  detailsLayout: {
    _tag: "Group",
    orientation: "vertical",
    items: [
      {
        _tag: "Group",
        orientation: "horizontal",
        items: [
          {
            _tag: "OtherDataProfile",
            profileRequirement: "givenName",
          },
          {
            _tag: "OtherDataProfile",
            profileRequirement: "surname",
          },
        ],
      },
      {
        _tag: "Answer",
        questionId: "displayName",
      },
      {
        _tag: "Answer",
        questionId: "address",
      },
      {
        _tag: "Answer",
        questionId: "telephone",
      },
      {
        _tag: "Answer",
        questionId: "email",
      },
      {
        _tag: "OtherDataProfilePhoto",
      },
    ],
  },
  status: "active",
};
