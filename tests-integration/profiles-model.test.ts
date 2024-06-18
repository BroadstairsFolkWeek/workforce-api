import { Config, Effect, Layer } from "effect";
import { defaultGraphClient } from "../src/graph/default-graph-client";
import { ProfilesRepository } from "../src/model/profiles-repository";
import { ModelProfileId } from "../src/model/interfaces/profile";
import { profilesRepositoryLive } from "../src/model/profiles-repository-graph";
import { profilesGraphListAccessLive } from "../src/model/graph/profiles-graph-list-access-live";

test("get profile by profileid", async () => {
  const program = Effect.all([
    Config.string("TEST_PROFILE_ID"),
    ProfilesRepository,
  ]).pipe(
    Effect.andThen(([profileId, repository]) =>
      repository.modelGetProfileByProfileId(ModelProfileId.make(profileId))
    )
  );

  const layers = profilesRepositoryLive.pipe(
    Layer.provide(profilesGraphListAccessLive),
    Layer.provide(defaultGraphClient)
  );

  const runnable = Effect.provide(program, layers);

  const result = await Effect.runPromise(runnable);

  console.log(JSON.stringify(result, null, 2));
});
