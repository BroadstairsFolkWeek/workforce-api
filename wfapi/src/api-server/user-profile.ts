import { Effect } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { userIdParamSchema } from "./interfaces/users";
import {
  ApiProfileUpdates,
  SetProfilePhotoResponse,
  UpdateProfileResponse,
} from "./interfaces/profiles";
import { setProfilePhoto, updateProfileByUserId } from "../services/profiles";
import { ModelUserId } from "../model/interfaces/user-login";
import { runWfApiEffect } from "./effect-runner";

const patchProfileBodySchema = z.object({
  version: z.number(),
  updates: z.unknown(),
});

const putPhotoBodySchema = z.object({
  contentMimeType: z.enum(["image/jpeg", "image/png"]),
  contentBase64: z.string(),
});

const userProfileApi = new Hono();

userProfileApi.patch(
  "/properties",
  zValidator("param", userIdParamSchema),
  zValidator("json", patchProfileBodySchema),
  async (c) => {
    const { userId } = c.req.valid("param");
    const { version, updates } = c.req.valid("json");

    const program = S.decodeUnknown(ApiProfileUpdates)(updates)
      .pipe(
        Effect.tap((profileUpdates) =>
          Effect.logTrace(
            `Received profile updates for user: ${userId}`,
            profileUpdates
          )
        ),
        Effect.andThen(
          updateProfileByUserId(ModelUserId.make(userId), version)
        ),
        Effect.andThen((profile) => ({ data: profile })),
        Effect.andThen(S.encode(UpdateProfileResponse)),
        Effect.tap((updateProfileResponse) =>
          Effect.logTrace(
            "Reporting successful profile update",
            updateProfileResponse
          )
        ),
        Effect.andThen((body) => c.json(body, 200))
      )
      .pipe(
        Effect.catchTag("UnknownUser", () => Effect.succeed(c.json({}, 404))),
        Effect.catchTag("ProfileNotFound", () =>
          Effect.succeed(c.json({}, 404))
        ),
        Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500))),
        Effect.catchTag("ProfileVersionMismatch", () =>
          Effect.succeed(c.json({}, 409))
        )
      );

    return runWfApiEffect(program);
  }
);

userProfileApi.put(
  "/photo",
  zValidator("param", userIdParamSchema),
  zValidator("json", putPhotoBodySchema),
  async (c) => {
    const { userId } = c.req.valid("param");

    const photoJsonData = c.req.valid("json");

    const photoContent = Buffer.from(photoJsonData.contentBase64, "base64");

    const program = setProfilePhoto(
      ModelUserId.make(userId),
      photoJsonData.contentMimeType,
      photoContent
    )
      .pipe(
        Effect.andThen((profile) => ({ data: profile })),
        Effect.andThen(S.encode(SetProfilePhotoResponse)),
        Effect.andThen((profile) => Effect.succeed(c.json(profile, 200)))
      )
      .pipe(
        Effect.catchTag("UnknownUser", () => Effect.succeed(c.json({}, 404))),
        Effect.catchTag("ProfileNotFound", () =>
          Effect.succeed(c.json({}, 404))
        ),
        Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500)))
      );

    return runWfApiEffect(program);
  }
);

export default userProfileApi;
