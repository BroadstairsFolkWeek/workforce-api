import { Effect } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { ModelUserId } from "../model/interfaces/user-login";
import { repositoriesLayerLive } from "../contexts/repositories-live";
import { logLevelLive } from "../util/logging";
import {
  GetUserResponse,
  PutUserPropertiesResponse,
  userIdParamSchema,
} from "./interfaces/users";
import { deleteUser, ensureUser, getUser } from "../services/users";
import userFormsApi from "./user-forms";
import userTemplatesApi from "./user-templates";
import { runWfApiEffect } from "./effect-runner";
import userProfileApi from "./user-profile";

const postUsersBodySchema = z.object({
  displayName: z.string(),
  email: z.string(),
});

const usersApi = new Hono();

usersApi.route("/:userId/forms", userFormsApi);

usersApi.route("/:userId/creatableforms", userTemplatesApi);

usersApi.route("/:userId/profile", userProfileApi);

usersApi.get("/:userId", zValidator("param", userIdParamSchema), async (c) => {
  const { userId } = c.req.valid("param");

  const program = getUser(ModelUserId.make(userId!))
    .pipe(
      Effect.tap(() =>
        Effect.logTrace(`Retrieved User and Profile: UserId${userId}`)
      ),
      Effect.andThen((userAndProfile) => ({ data: userAndProfile })),
      Effect.andThen(S.encode(GetUserResponse)),
      Effect.andThen((body) => c.json(body, 200))
    )
    .pipe(
      Effect.catchTags({
        UnknownUser: () => Effect.succeed(c.json({}, 404)),
        ParseError: () => Effect.succeed(c.json({}, 500)),
      })
    );

  return runWfApiEffect(program);
});

usersApi.put(
  "/:userId/properties",
  zValidator("param", userIdParamSchema),
  zValidator("json", postUsersBodySchema),
  async (c) => {
    const { userId } = c.req.valid("param");
    const requestBody = c.req.valid("json");

    const program = ensureUser(
      ModelUserId.make(userId!),
      requestBody.displayName,
      requestBody.email
    )
      .pipe(
        Effect.tap(() =>
          Effect.logTrace(`Ensured user and profile. UserId: ${userId}`)
        ),
        Effect.andThen((userAndProfile) => ({ data: userAndProfile })),
        Effect.andThen(S.encode(PutUserPropertiesResponse)),
        Effect.andThen((body) => c.json(body, 200))
      )
      .pipe(
        Effect.catchTags({
          ParseError: () => Effect.succeed(c.json({}, 500)),
        })
      );

    return runWfApiEffect(program);
  }
);

usersApi.delete(
  "/:userId",
  zValidator("param", userIdParamSchema),
  async (c) => {
    const { userId } = c.req.valid("param");

    const program = deleteUser(ModelUserId.make(userId!))
      .pipe(
        Effect.tap(() => Effect.logInfo(`Deleted user: ${userId}`)),
        Effect.andThen(c.json({}, 200))
      )
      .pipe(
        Effect.catchTag("UnknownUser", () => Effect.succeed(c.json({}, 404))),
        Effect.catchTag("ProfileNotFound", () =>
          Effect.succeed(c.json({}, 404))
        )
      );

    const runnable = program.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(logLevelLive)
    );

    return await Effect.runPromise(runnable);
  }
);

export default usersApi;
