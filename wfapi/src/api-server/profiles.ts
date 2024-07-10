import { Effect } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { GetProfilesResponse } from "./interfaces/profiles";
import { getProfiles } from "../services/profiles";
import { repositoriesLayerLive } from "../contexts/repositories-live";
import { logLevelLive } from "../util/logging";

const profilesApi = new Hono();

profilesApi.get("/", async (c) => {
  const getProfilesEffect = getProfiles()
    .pipe(
      Effect.andThen((profiles) => ({ data: profiles })),
      Effect.andThen(S.encode(GetProfilesResponse)),
      Effect.andThen((body) => c.json(body, 200))
    )
    .pipe(
      Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500)))
    );

  return await Effect.runPromise(
    getProfilesEffect.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(logLevelLive)
    )
  );
});

export default profilesApi;
