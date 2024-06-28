import { Effect } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { GetProfileResponse } from "./interfaces/profiles";
import { getProfileByUserId } from "../services/profiles";
import { ModelUserId } from "../model/interfaces/user-login";
import { repositoriesLayerLive } from "../contexts/repositories-live";

const userIdParamSchema = z.object({ userId: z.string().brand("UserId") });

const usersApi = new Hono();

usersApi.get(
  "/:userId/profile",
  zValidator("param", userIdParamSchema),
  async (c) => {
    const { userId } = c.req.valid("param");

    const getProfileProgram = getProfileByUserId(ModelUserId.make(userId!))
      .pipe(
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
      Effect.provide(repositoriesLayerLive)
    );

    return await Effect.runPromise(runnable);
  }
);

export default usersApi;
