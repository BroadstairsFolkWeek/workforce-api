import { Config, Effect } from "effect";
import { ModelProfileId } from "../src/model/interfaces/profile";
import { formsLayerLive } from "../src/contexts/forms-live";
import { FormProvider } from "../src/forms/providers/form-provider";

test("BRITTLE: get active forms by profileid returns the existing Workforce Application form", async () => {
  const program = Effect.all([
    FormProvider,
    Config.string("TEST_PROFILE_ID"),
  ]).pipe(
    Effect.andThen(([formProvider, profileId]) =>
      formProvider.getActiveFormSubmissions(ModelProfileId.make(profileId))
    )
  );

  const runnable = Effect.provide(program, formsLayerLive);

  const result = await Effect.runPromise(runnable);

  expect(result).toHaveLength(1);
  expect(result[0].formSpecId).toBe("WorkforceApplicationForm");
  console.log(JSON.stringify(result, null, 2));
});

test("BRITTILE: get creatable form specs by profileid return 0 forms since Workforce Application form already exists", async () => {
  const program = Effect.all([
    FormProvider,
    Config.string("TEST_PROFILE_ID"),
  ]).pipe(
    Effect.andThen(([formProvider, profileId]) =>
      formProvider.getCreatableFormSpecs(ModelProfileId.make(profileId))
    )
  );

  const runnable = Effect.provide(program, formsLayerLive);

  const result = await Effect.runPromise(runnable);

  expect(result).toHaveLength(0);
});

test("BRITTLE: get creatable form specs by new profile ID return the Workforce Application form spec", async () => {
  const program = Effect.all([FormProvider]).pipe(
    Effect.andThen(([formProvider]) =>
      formProvider.getCreatableFormSpecs(
        ModelProfileId.make("UnknownProfileId")
      )
    )
  );

  const runnable = Effect.provide(program, formsLayerLive);

  const result = await Effect.runPromise(runnable);

  expect(result).toHaveLength(1);
  expect(result[0].id).toBe("WorkforceApplicationForm");
});
