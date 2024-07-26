import {
  FormProviderId,
  FormProviderSpecId,
  FormSpec,
  FormSpecId,
} from "../../form";

// Hardcoded survey specification representing the Workforce Application Form for 2024.
import applicationFormQuestionsModel from "./wf-application-form-questions.json";

const workforceApplicationFormProviderSpecId = FormProviderSpecId.make(
  "WorkforceApplicationForm"
);

export const workforceApplicationFormSpecId = FormSpecId.make(
  "WorkforceApplicationForm"
);

export const workforceApplicationFormSpec: FormSpec = {
  formProviderId: FormProviderId.make("wf-application-form-provider"),
  formProviderSpecId: workforceApplicationFormProviderSpecId,
  id: workforceApplicationFormSpecId,
  shortName: "WF 2024",
  fullName: "Workforce Application Form 2024",
  description: "Workforce Application Form for BFW 2024.",
  questions: applicationFormQuestionsModel,
  requirements: {
    profileRequirements: {
      firstName: true,
      surname: true,
      displayName: true,
      address: true,
      telephone: true,
      email: true,
      photo: true,
    },
  },
  status: "active",
};
