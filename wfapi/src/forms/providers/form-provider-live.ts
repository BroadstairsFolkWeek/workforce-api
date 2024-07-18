import { Array, Context, Effect, Layer } from "effect";
import { ModelProfileId } from "../../model/interfaces/profile";
import {
  FormProviderId,
  FormProviderSubmissionId,
  FormSpecId,
  VerifiedFormSubmissionStatus,
} from "../form";
import { FormProvider } from "./form-provider";
import { WfApplicationFormProvider } from "./wf-application-forms/wf-application-form-provider";

type ProvidersType = readonly Context.Tag.Service<FormProvider>[];

const getCreatableFormSpecs =
  (providers: ProvidersType) => (profileId: ModelProfileId) =>
    Effect.all(
      providers.map((provider) => provider.getCreatableFormSpecs(profileId))
    ).pipe(Effect.andThen(Array.flatten));

const getFormSpec = (providers: ProvidersType) => (formSpecId: FormSpecId) =>
  Effect.firstSuccessOf(
    providers.map((provider) => provider.getFormSpec(formSpecId))
  );

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

export const formProviderLive = Layer.effect(
  FormProvider,
  Effect.all([WfApplicationFormProvider]).pipe(
    Effect.andThen((providers) =>
      Effect.succeed({
        getActiveFormSubmissions: getActiveFormSubmissions(providers),

        getFormSpec: getFormSpec(providers),

        getCreatableFormSpecs: getCreatableFormSpecs(providers),

        updateFormSubmissionByFormProviderSubmissionId:
          updateFormSubmissionByFormProviderSubmissionId(providers),
      })
    )
  )
);
