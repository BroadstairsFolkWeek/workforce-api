import { Effect } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  ApiProfileUpdates,
  GetProfileResponse,
  SetProfilePhotoResponse,
  UpdateProfileResponse,
} from "./interfaces/profiles";
import {
  getProfileByUserId,
  setProfilePhoto,
  updateProfileByUserId,
} from "../services/profiles";
import { ModelUserId } from "../model/interfaces/user-login";
import { repositoriesLayerLive } from "../contexts/repositories-live";
import { logLevelLive } from "../util/logging";
import { getFormsByUserId } from "../forms/forms";
import { GetUserFormsResponse } from "./interfaces/forms";
import { formsLayerLive } from "../contexts/forms-live";

const userIdParamSchema = z.object({ userId: z.string().brand("UserId") });

const patchProfileBodySchema = z.object({
  version: z.number(),
  updates: z.unknown(),
});

const putPhotoBodySchema = z.object({
  contentMimeType: z.enum(["image/jpeg", "image/png"]),
  contentBase64: z.string(),
});

const usersApi = new Hono();

usersApi.get(
  "/:userId/profile",
  zValidator("param", userIdParamSchema),
  async (c) => {
    const { userId } = c.req.valid("param");

    const getProfileProgram = getProfileByUserId(ModelUserId.make(userId!))
      .pipe(
        Effect.tap((profile) =>
          Effect.logTrace(`Retrieved profile for user: ${userId}`, profile)
        ),
        Effect.andThen((profile) => ({ data: profile })),
        Effect.andThen(S.encode(GetProfileResponse)),
        Effect.andThen((body) => c.json(body, 200))
      )
      .pipe(
        Effect.catchTag("UnknownUser", () => Effect.succeed(c.json({}, 404))),
        Effect.catchTag("ProfileNotFound", () =>
          Effect.succeed(c.json({}, 404))
        ),
        Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500)))
      );

    const runnable = getProfileProgram.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(logLevelLive)
    );

    return await Effect.runPromise(runnable);
  }
);

usersApi.patch(
  "/:userId/profile",
  zValidator("param", userIdParamSchema),
  zValidator("json", patchProfileBodySchema),
  async (c) => {
    const { userId } = c.req.valid("param");
    const { version, updates } = c.req.valid("json");

    const patchProfileProgram = S.decodeUnknown(ApiProfileUpdates)(updates)
      .pipe(
        Effect.tap((profileUpdates) =>
          Effect.logTrace(
            `Retrieved profile updates for user: ${userId}`,
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

    const runnable = patchProfileProgram.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(logLevelLive)
    );

    return await Effect.runPromise(runnable);
  }
);

usersApi.put(
  "/:userId/profile/photo",
  zValidator("param", userIdParamSchema),
  zValidator("json", putPhotoBodySchema),
  async (c) => {
    const { userId } = c.req.valid("param");

    const photoJsonData = c.req.valid("json");

    const photoContent = Buffer.from(photoJsonData.contentBase64, "base64");

    const putProfilePhotoEffect = setProfilePhoto(
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

    return await Effect.runPromise(
      putProfilePhotoEffect.pipe(
        Effect.provide(repositoriesLayerLive),
        Effect.provide(logLevelLive)
      )
    );
  }
);

usersApi.get(
  "/:userId/profile/forms",
  zValidator("param", userIdParamSchema),
  async (c) => {
    const { userId } = c.req.valid("param");

    const getFormsProgram = getFormsByUserId(ModelUserId.make(userId!))
      .pipe(
        Effect.tap((forms) =>
          Effect.logTrace(
            `Retrieved ${forms.length} forms for user: ${userId}`,
            forms
          )
        ),
        Effect.andThen((profile) => ({ data: profile })),
        Effect.andThen(S.encode(GetUserFormsResponse)),
        Effect.andThen((body) => c.json(body, 200))
      )
      .pipe(
        Effect.catchTag("UnknownUser", () => Effect.succeed(c.json({}, 404))),
        Effect.catchTag("ProfileNotFound", () =>
          Effect.succeed(c.json({}, 404))
        ),
        Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500))),
        Effect.catchTag("FormSpecNotFound", () =>
          Effect.succeed(c.json({}, 500))
        )
      );

    const runnable = getFormsProgram.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(formsLayerLive),
      Effect.provide(logLevelLive)
    );

    return await Effect.runPromise(runnable);
  }
);

export default usersApi;
