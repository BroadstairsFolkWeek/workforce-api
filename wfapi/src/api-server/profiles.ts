import { Effect } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  GetProfilesResponse,
  SetProfilePhotoResponse,
} from "./interfaces/profiles";
import {
  getProfileByUserId,
  getProfiles,
  setProfilePhoto,
} from "../services/profiles";
import { ModelUserId } from "../model/interfaces/user-login";
import { repositoriesLayerLive } from "../contexts/repositories-live";
import { ModelProfileId } from "../model/interfaces/profile";

const profilesGetQuerySchema = z.object({
  userId: z.string().optional(),
});

const profileIdParamSchema = z.object({ profileId: z.string() });

const putProfilePhotoBodySchema = z.object({
  contentMimeType: z.enum(["image/jpeg", "image/png"]),
  contentBase64: z.string(),
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

profilesApi.put(
  "/:profileId/photo",
  zValidator("json", putProfilePhotoBodySchema),
  zValidator("param", profileIdParamSchema),
  async (c) => {
    const { profileId } = c.req.valid("param");
    const photoJsonData = c.req.valid("json");

    const photoContent = Buffer.from(photoJsonData.contentBase64, "base64");

    const putProfilePhotoEffect = setProfilePhoto(
      ModelProfileId.make(profileId),
      photoJsonData.contentMimeType,
      photoContent
    )
      .pipe(
        Effect.andThen(S.encode(SetProfilePhotoResponse)),
        Effect.andThen((profile) => Effect.succeed(c.json(profile, 200)))
      )
      .pipe(
        Effect.catchTag("ProfileNotFound", () =>
          Effect.succeed(c.json({}, 404))
        )
      );

    return await Effect.runPromise(
      putProfilePhotoEffect.pipe(Effect.provide(repositoriesLayerLive))
    );
  }
);

export default profilesApi;
