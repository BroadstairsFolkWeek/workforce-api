import { Effect } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { userIdParamSchema } from "./interfaces/users";
import {
  SetProfilePhotoResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "./interfaces/profiles";
import { setProfilePhoto, updateProfileByUserId } from "../services/profiles";
import { ModelUserId } from "../model/interfaces/user-login";
import { runWfApiEffect } from "./effect-runner";
import { ApiInvalidRequest } from "./interfaces/api";

const putPhotoBodySchema = z.object({
  contentMimeType: z.enum(["image/jpeg", "image/png"]),
  contentBase64: z.string(),
});

const userProfileApi = new Hono();

userProfileApi.put(
  "/properties",
  zValidator("param", userIdParamSchema),
  async (c) => {
    const { userId } = c.req.valid("param");

    const program = Effect.tryPromise({
      try: () => c.req.json(),
      catch: (error) => new ApiInvalidRequest({ error }),
    })
      .pipe(
        Effect.andThen(S.decodeUnknown(UpdateProfileRequest)),
        Effect.catchTag("ParseError", (error) =>
          Effect.fail(new ApiInvalidRequest({ error }))
        ),
        Effect.tapErrorTag("ApiInvalidRequest", (e) =>
          Effect.logWarning(
            "Error parsing JSON for user profile properties PUT request",
            e.error
          )
        )
      )
      .pipe(
        Effect.tap((profileUpdates) =>
          Effect.logTrace(
            `Received profile updates for user: ${userId}`,
            profileUpdates
          )
        ),
        Effect.andThen((decodedBody) =>
          updateProfileByUserId(
            ModelUserId.make(userId),
            decodedBody.applyToVersion
          )(decodedBody.properties)
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
        Effect.catchTags({
          ApiInvalidRequest: () => Effect.succeed(c.json({}, 400)),
          UnknownUser: () => Effect.succeed(c.json({}, 404)),
          ProfileNotFound: () => Effect.succeed(c.json({}, 404)),
          ParseError: () => Effect.succeed(c.json({}, 500)),
          ProfileVersionMismatch: () => Effect.succeed(c.json({}, 409)),
        })
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
