import { Config, Effect } from "effect";
import { ModelProfileId } from "../src/model/interfaces/profile";
import { FormsAccess } from "../src/forms/access/forms-access";
import { formsLayerLive } from "../src/contexts/forms-live";

test("BRITTLE: get active forms by profileid returns the existing Workforce Application form", async () => {
  const program = Effect.all([
    FormsAccess,
    Config.string("TEST_PROFILE_ID"),
  ]).pipe(
    Effect.andThen(([formsAccess, profileId]) =>
      formsAccess.getActiveFormSubmissions(ModelProfileId.make(profileId))
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
    FormsAccess,
    Config.string("TEST_PROFILE_ID"),
  ]).pipe(
    Effect.andThen(([formsAccess, profileId]) =>
      formsAccess.getCreatableFormSpecs(ModelProfileId.make(profileId))
    )
  );

  const runnable = Effect.provide(program, formsLayerLive);

  const result = await Effect.runPromise(runnable);

  expect(result).toHaveLength(0);
});

test("BRITTLE: get creatable form specs by new profile ID return the Workforce Application form spec", async () => {
  const program = Effect.all([FormsAccess]).pipe(
    Effect.andThen(([formsAccess]) =>
      formsAccess.getCreatableFormSpecs(ModelProfileId.make("UnknownProfileId"))
    )
  );

  const runnable = Effect.provide(program, formsLayerLive);

  const result = await Effect.runPromise(runnable);

  expect(result).toHaveLength(1);
  expect(result[0].id).toBe("WorkforceApplicationForm");
});
