import { Context, Data, Effect } from "effect";
import { ModelProfileId } from "../../model/interfaces/profile";
import {
  FormProviderId,
  FormProviderSubmissionId,
  FormSpec,
  FormSpecId,
  UnverifiedFormSubmission,
  VerifiedFormSubmissionStatus,
} from "../form";
import { FormSubmissionNotFound } from "../forms";

export class FormSpecNotFound extends Data.TaggedClass("FormSpecNotFound")<{
  readonly formSpecId: FormSpecId;
}> {}

export class FormProviderNotMatched extends Data.TaggedClass(
  "FormProviderNotMatched"
) {}

export class FormProvider extends Context.Tag("FormProvider")<
  FormProvider,
  {
    getCreatableFormSpecs: (
      profileId: ModelProfileId
    ) => Effect.Effect<readonly FormSpec[]>;

    getCreatableFormSpec: (
      profileId: ModelProfileId
    ) => (formSpecId: FormSpecId) => Effect.Effect<FormSpec, FormSpecNotFound>;

    getFormSpec: (
      formSpecId: FormSpecId
    ) => Effect.Effect<FormSpec, FormSpecNotFound>;

    createFormSubmission: (
      profileId: ModelProfileId
    ) => (
      formSpecId: FormSpecId,
      answers: unknown
    ) => Effect.Effect<UnverifiedFormSubmission, never, never>;

    getActiveFormSubmissions: (
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
      formSubmissionStatus: VerifiedFormSubmissionStatus
    ) => Effect.Effect<UnverifiedFormSubmission, FormSubmissionNotFound, never>;

    deleteFormSubmissionByFormProviderSubmissionId: (
      formProviderId: FormProviderId,
      formProviderSubmissionId: FormProviderSubmissionId
    ) => Effect.Effect<unknown, FormSubmissionNotFound, never>;
  }
>() {}
