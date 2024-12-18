import { Context, Data, Effect } from "effect";
import { ModelProfileId } from "./interfaces/profile";
import {
  FormProviderId,
  FormProviderSubmissionId,
  Template,
  TemplateId,
  UnverifiedFormSubmission,
  VerifiedFormSubmissionStatus,
} from "../interfaces/form";
import { FormSubmissionNotFound } from "../forms/forms";

export class FormSpecNotFound extends Data.TaggedClass("FormSpecNotFound")<{
  readonly formSpecId: TemplateId;
}> {}

export class FormProviderNotMatched extends Data.TaggedClass(
  "FormProviderNotMatched"
) {}

export class FormsRepository extends Context.Tag("FormsRepository")<
  FormsRepository,
  {
    getCreatableFormSpecs: (
      profileId: ModelProfileId
    ) => Effect.Effect<readonly Template[]>;

    getCreatableFormSpec: (
      profileId: ModelProfileId
    ) => (formSpecId: TemplateId) => Effect.Effect<Template, FormSpecNotFound>;

    getFormSpec: (
      formSpecId: TemplateId
    ) => Effect.Effect<Template, FormSpecNotFound>;

    createFormSubmission: (
      profileId: ModelProfileId
    ) => (
      formSpecId: TemplateId,
      answers: unknown
    ) => Effect.Effect<UnverifiedFormSubmission, never, never>;

    getActiveForms: () => Effect.Effect<
      readonly UnverifiedFormSubmission[],
      never,
      never
    >;

    getActiveFormSubmissionsByProfileId: (
      profileId: ModelProfileId
    ) => Effect.Effect<readonly UnverifiedFormSubmission[], never, never>;

    updateFormSubmissionByFormProviderSubmissionId: (
      formProviderId: FormProviderId,
      formProviderSubmissionId: FormProviderSubmissionId
    ) => (
      profileId: ModelProfileId
    ) => (
      formSubmissionStatus: VerifiedFormSubmissionStatus,
      answers: unknown
    ) => Effect.Effect<UnverifiedFormSubmission, FormSubmissionNotFound, never>;

    updateFormSubmissionStatusByFormProviderSubmissionId: (
      formProviderId: FormProviderId,
      formProviderSubmissionId: FormProviderSubmissionId
    ) => (
      profileId: ModelProfileId
    ) => (
      formSubmissionStatus: VerifiedFormSubmissionStatus,
      otherData: unknown
    ) => Effect.Effect<UnverifiedFormSubmission, FormSubmissionNotFound, never>;

    deleteFormSubmissionByFormProviderSubmissionId: (
      formProviderId: FormProviderId,
      formProviderSubmissionId: FormProviderSubmissionId
    ) => Effect.Effect<unknown, FormSubmissionNotFound, never>;
  }
>() {}
