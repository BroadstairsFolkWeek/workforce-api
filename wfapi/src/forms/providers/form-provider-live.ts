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

type ProvidersType = readonly Context.Tag.Service<FormProvider>[];

const getCreatableFormSpecs =
  (providers: ProvidersType) => (profileId: ModelProfileId) =>
    Effect.all(
      providers.map((provider) => provider.getCreatableFormSpecs(profileId))
    ).pipe(Effect.andThen(Array.flatten));

const getCreatableFormSpec =
  (providers: ProvidersType) =>
  (profileId: ModelProfileId) =>
  (formSpecId: TemplateId) =>
    getCreatableFormSpecs(providers)(profileId).pipe(
      Effect.andThen(Array.filter((formSpec) => formSpec.id === formSpecId)),
      Effect.andThen(Array.head),
      Effect.catchTag("NoSuchElementException", () =>
        Effect.fail(new FormSpecNotFound({ formSpecId }))
      )
    );

const getFormSpec = (providers: ProvidersType) => (formSpecId: TemplateId) =>
  Effect.firstSuccessOf(
    providers.map((provider) => provider.getFormSpec(formSpecId))
  );

const createFormSubmission =
  (providers: ProvidersType) =>
  (profileId: ModelProfileId) =>
  (formSpecId: TemplateId, answers: unknown) =>
    providers[0].createFormSubmission(profileId)(formSpecId, answers);

const getActiveFormSubmissions =
  (providers: ProvidersType) => (profileId: ModelProfileId) =>
    Effect.all(
      providers.map((provider) => provider.getActiveFormSubmissions(profileId))
    ).pipe(Effect.andThen(Array.flatten));

const updateFormSubmissionByFormProviderSubmissionId =
  (providers: ProvidersType) =>
  (
    formProviderId: FormProviderId,
    formProviderSubmissionId: FormProviderSubmissionId
  ) =>
  (profileId: ModelProfileId) =>
  (formSubmissionStatus: VerifiedFormSubmissionStatus, answers: unknown) =>
    providers[0].updateFormSubmissionByFormProviderSubmissionId(
      formProviderId,
      formProviderSubmissionId
    )(profileId)(formSubmissionStatus, answers);

const updateFormSubmissionStatusByFormProviderSubmissionId =
  (providers: ProvidersType) =>
  (
    formProviderId: FormProviderId,
    formProviderSubmissionId: FormProviderSubmissionId
  ) =>
  (profileId: ModelProfileId) =>
  (formSubmissionStatus: VerifiedFormSubmissionStatus) =>
    providers[0].updateFormSubmissionStatusByFormProviderSubmissionId(
      formProviderId,
      formProviderSubmissionId
    )(profileId)(formSubmissionStatus);

const deleteFormSubmissionByFormProviderSubmissionId =
  (providers: ProvidersType) =>
  (
    formProviderId: FormProviderId,
    formProviderSubmissionId: FormProviderSubmissionId
  ) =>
    providers[0].deleteFormSubmissionByFormProviderSubmissionId(
      formProviderId,
      formProviderSubmissionId
    );

export const formProviderLive = Layer.effect(
  FormProvider,
  Effect.all([WfApplicationFormProvider]).pipe(
    Effect.andThen((providers) =>
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
