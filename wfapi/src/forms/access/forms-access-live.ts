import { Array, Effect, Layer } from "effect";
import { FormsAccess } from "./forms-access";
import { WfApplicationFormProvider } from "../providers/wf-application-forms/wf-application-form-provider";
import { ModelProfileId } from "../../model/interfaces/profile";
import { FormSpec, FormSpecId, UnverifiedFormSubmission } from "../form";
import { FormProvider, FormSpecNotFound } from "../providers/form-provider";

const getCreatableFormSpecs =
  (providers: FormProvider[]) =>
  (profileId: ModelProfileId): Effect.Effect<readonly FormSpec[]> =>
    Effect.all(
      providers.map((provider) => provider.getCreatableFormSpecs(profileId))
    ).pipe(Effect.andThen(Array.flatten));

const getFormSpec =
  (providers: FormProvider[]) =>
  (formSpecId: FormSpecId): Effect.Effect<FormSpec, FormSpecNotFound> =>
    Effect.firstSuccessOf(
      providers.map((provider) => provider.getFormSpec(formSpecId))
    );

const getActiveFormSubmissions =
  (providers: FormProvider[]) =>
  (
    profileId: ModelProfileId
  ): Effect.Effect<readonly UnverifiedFormSubmission[], never, never> =>
    Effect.all(
      providers.map((provider) => provider.getActiveFormSubmissions(profileId))
    ).pipe(Effect.andThen(Array.flatten));

export const formsAccessLive = Layer.effect(
  FormsAccess,
  Effect.all([WfApplicationFormProvider]).pipe(
    Effect.andThen((providers) =>
      Effect.succeed({
        getActiveFormSubmissions: getActiveFormSubmissions(providers),

        getFormSpec: getFormSpec(providers),

        getCreatableFormSpecs: getCreatableFormSpecs(providers),
      })
    )
  )
);
