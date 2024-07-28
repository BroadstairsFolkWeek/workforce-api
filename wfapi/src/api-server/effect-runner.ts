import { Effect } from "effect";
import { ConfigError } from "effect/ConfigError";
import { repositoriesLayerLive } from "../contexts/repositories-live";
import { formsLayerLive } from "../contexts/forms-live";
import { logLevelLive } from "../util/logging";
import { UserLoginRepository } from "../model/user-logins-repository";
import { ProfilesRepository } from "../model/profiles-repository";
import { PhotosRepository } from "../model/photos-repository";
import { FormProvider } from "../forms/providers/form-provider";

export const runWfApiEffect = async <A extends any>(
  program: Effect.Effect<
    A,
    ConfigError,
    UserLoginRepository | ProfilesRepository | PhotosRepository | FormProvider
  >
) => {
  const runnable: Effect.Effect<A, ConfigError> = program.pipe(
    Effect.provide(repositoriesLayerLive),
    Effect.provide(formsLayerLive),
    Effect.provide(logLevelLive)
  );

  return await Effect.runPromise(runnable);
};
