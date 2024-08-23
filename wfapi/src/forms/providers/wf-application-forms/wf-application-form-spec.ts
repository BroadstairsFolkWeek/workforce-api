import {
  FormProviderId,
  FormProviderSpecId,
  Template,
  TemplateId,
} from "../../form";

// Hardcoded survey specification representing the Workforce Application Form for 2024.
import applicationFormQuestionsModel from "./wf-application-form-questions.json";

const workforceApplicationFormProviderSpecId = FormProviderSpecId.make(
  "WorkforceApplicationForm"
);

export const workforceApplicationFormSpecId = TemplateId.make(
  "WorkforceApplicationForm"
);

export const workforceApplicationFormSpec: Template = {
  formProviderId: FormProviderId.make("wf-application-form-provider"),
  formProviderSpecId: workforceApplicationFormProviderSpecId,
  id: workforceApplicationFormSpecId,
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
