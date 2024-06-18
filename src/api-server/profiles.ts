import { Effect } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { GetProfilesResponse } from "./interfaces/profiles";
import { getProfileByUserId, getProfiles } from "../services/profiles";
import { ModelUserId } from "../model/interfaces/user-login";
import { repositoriesLayerLive } from "../contexts/repositories-live";

const profilesGetQuerySchema = z.object({
  userId: z.string().optional(),
});

const profilesApi = new Hono();

profilesApi.get("/", zValidator("query", profilesGetQuerySchema), async (c) => {
  const userId = c.req.query("userId");

  const getProfilesEffect = Effect.if(!!userId, {
    onTrue: () =>
      getProfileByUserId(ModelUserId.make(userId!)).pipe(
        Effect.andThen((profile) => [profile]),
        Effect.andThen(S.encode(GetProfilesResponse)),
        Effect.andThen((body) => c.json(body, 200))
      ),
    onFalse: () =>
      getProfiles().pipe(
        Effect.andThen(S.encode(GetProfilesResponse)),
        Effect.andThen((body) => c.json(body, 200))
      ),
  }).pipe(
    Effect.catchTag("UnknownUser", () => Effect.succeed(c.json({}, 404))),
    Effect.catchTag("ProfileNotFound", () => Effect.succeed(c.json({}, 404))),
    Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500)))
  );

  return await Effect.runPromise(
    getProfilesEffect.pipe(Effect.provide(repositoriesLayerLive))
  );
});

export default profilesApi;
