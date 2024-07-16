import { Effect } from "effect";
import { ModelProfileId } from "../../model/interfaces/profile";
import { FormSpec, FormSpecId, UnverifiedFormSubmission } from "../form";

export class FormSpecNotFound {
  readonly _tag = "FormSpecNotFound";
  constructor(readonly formSpecId: FormSpecId) {}
}

export interface FormProvider {
  getCreatableFormSpecs: (
    profileId: ModelProfileId
  ) => Effect.Effect<readonly FormSpec[]>;
  getFormSpec: (
    formSpecId: FormSpecId
  ) => Effect.Effect<FormSpec, FormSpecNotFound>;
  getActiveFormSubmissions: (
    profileId: ModelProfileId
  ) => Effect.Effect<readonly UnverifiedFormSubmission[], never, never>;
}
