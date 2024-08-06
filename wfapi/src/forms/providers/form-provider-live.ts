import { Array, Context, Effect, Layer } from "effect";
import { ModelProfileId } from "../../model/interfaces/profile";
import {
  FormProviderId,
  FormProviderSubmissionId,
  TemplateId,
  VerifiedFormSubmissionStatus,
} from "../form";
import { FormProvider, FormSpecNotFound } from "./form-provider";
import { WfApplicationFormProvider } from "./wf-application-forms/wf-application-form-provider";

type WfApplicationFormProviderType =
  Context.Tag.Service<WfApplicationFormProvider>;

const getCreatableFormSpecs =
  (provider: WfApplicationFormProviderType) => (profileId: ModelProfileId) =>
    provider.getCreatableFormSpecs(profileId);

const getCreatableFormSpec =
  (provider: WfApplicationFormProviderType) =>
  (profileId: ModelProfileId) =>
  (formSpecId: TemplateId) =>
    getCreatableFormSpecs(provider)(profileId).pipe(
      Effect.andThen(Array.filter((formSpec) => formSpec.id === formSpecId)),
      Effect.andThen(Array.head),
      Effect.catchTag("NoSuchElementException", () =>
        Effect.fail(new FormSpecNotFound({ formSpecId }))
      )
    );

const getFormSpec =
  (provider: WfApplicationFormProviderType) => (formSpecId: TemplateId) =>
    provider.getFormSpec(formSpecId);

const createFormSubmission =
  (provider: WfApplicationFormProviderType) =>
  (profileId: ModelProfileId) =>
  (formSpecId: TemplateId, answers: unknown) =>
    provider.createFormSubmission(profileId)(formSpecId, answers);

const getActiveFormSubmissions =
  (provider: WfApplicationFormProviderType) => (profileId: ModelProfileId) =>
    provider.getActiveFormSubmissions(profileId);

const updateFormSubmissionByFormProviderSubmissionId =
  (provider: WfApplicationFormProviderType) =>
  (
    formProviderId: FormProviderId,
    formProviderSubmissionId: FormProviderSubmissionId
  ) =>
  (profileId: ModelProfileId) =>
  (formSubmissionStatus: VerifiedFormSubmissionStatus, answers: unknown) =>
    provider.updateFormSubmissionByFormProviderSubmissionId(
      formProviderId,
      formProviderSubmissionId
    )(profileId)(formSubmissionStatus, answers);

const updateFormSubmissionStatusByFormProviderSubmissionId =
  (provider: WfApplicationFormProviderType) =>
  (
    formProviderId: FormProviderId,
    formProviderSubmissionId: FormProviderSubmissionId
  ) =>
  (profileId: ModelProfileId) =>
  (formSubmissionStatus: VerifiedFormSubmissionStatus, otherData: unknown) =>
    provider.updateFormSubmissionStatusByFormProviderSubmissionId(
      formProviderId,
      formProviderSubmissionId
    )(profileId)(formSubmissionStatus, otherData);

const deleteFormSubmissionByFormProviderSubmissionId =
  (provider: WfApplicationFormProviderType) =>
  (
    formProviderId: FormProviderId,
    formProviderSubmissionId: FormProviderSubmissionId
  ) =>
    provider.deleteFormSubmissionByFormProviderSubmissionId(
      formProviderId,
      formProviderSubmissionId
    );

export const formProviderLive = Layer.effect(
  FormProvider,
  Effect.all([WfApplicationFormProvider]).pipe(
    Effect.andThen(([providers]) =>
      Effect.succeed({
        getActiveFormSubmissions: getActiveFormSubmissions(providers),

        getCreatableFormSpec: getCreatableFormSpec(providers),

        getFormSpec: getFormSpec(providers),

        getCreatableFormSpecs: getCreatableFormSpecs(providers),

        createFormSubmission: createFormSubmission(providers),

        updateFormSubmissionByFormProviderSubmissionId:
          updateFormSubmissionByFormProviderSubmissionId(providers),

        updateFormSubmissionStatusByFormProviderSubmissionId:
          updateFormSubmissionStatusByFormProviderSubmissionId(providers),

        deleteFormSubmissionByFormProviderSubmissionId:
          deleteFormSubmissionByFormProviderSubmissionId(providers),
      })
    )
  )
);
