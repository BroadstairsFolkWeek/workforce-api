import { Effect } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { userIdParamSchema } from "./interfaces/users";
import {
  createFormSubmissionForUserId,
  getCreatableFormsByUserId,
} from "../forms/forms";
import { ModelUserId } from "../model/interfaces/user-login";
import {
  GetCreatableFormSpecsResponse,
  PostUserCreatableFormNewFormRequest,
  PostUserCreatableFormNewFormResponse,
} from "./interfaces/user-forms";
import { runWfApiEffect } from "./effect-runner";
import { postCreatableFormParamsSchema } from "./interfaces/user-templates";
import { TemplateId } from "../interfaces/form";
import { ApiInvalidRequest } from "./interfaces/api";
import { UserId } from "../interfaces/user";

const userTemplatesApi = new Hono();

userTemplatesApi.get("/", zValidator("param", userIdParamSchema), async (c) => {
  const { userId } = c.req.valid("param");

  const program = getCreatableFormsByUserId(ModelUserId.make(userId!))
    .pipe(
      Effect.tap((forms) =>
        Effect.logTrace(
          `Retrieved ${forms.length} forms for user: ${userId}`,
          forms
        )
      ),
      Effect.andThen((formSpecs) => ({ data: formSpecs })),
      Effect.andThen(S.encode(GetCreatableFormSpecsResponse)),
      Effect.andThen((body) => c.json(body, 200))
    )
    .pipe(
      Effect.catchTag("UnknownUser", () => Effect.succeed(c.json({}, 404))),
      Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500)))
    );

  return runWfApiEffect(program);
});

userTemplatesApi.post(
  "/:formSpecId/create",
  zValidator("param", postCreatableFormParamsSchema),
  async (c) => {
    const userIdEffect = S.decodeUnknown(UserId)(c.req.valid("param").userId);

    const formSpecIdEffect = S.decodeUnknown(TemplateId)(
      c.req.valid("param").formSpecId
    );

    const decodedRequestBody = Effect.tryPromise({
      try: () => c.req.json(),
      catch: (error) => new ApiInvalidRequest({ error }),
    }).pipe(
      Effect.andThen(S.decodeUnknown(PostUserCreatableFormNewFormRequest)),
      Effect.catchTag("ParseError", (error) =>
        Effect.fail(new ApiInvalidRequest({ error }))
      )
    );

    const program = Effect.all([
      userIdEffect,
      formSpecIdEffect,
      decodedRequestBody,
    ])
      .pipe(
        Effect.andThen(([userId, formSpecId, requestBody]) =>
          createFormSubmissionForUserId(userId)(formSpecId)(requestBody.answers)
        ),
        Effect.andThen((formSubmission) => ({ data: formSubmission })),
        Effect.andThen(S.encode(PostUserCreatableFormNewFormResponse)),
        Effect.andThen((body) => c.json(body, 200))
      )
      .pipe(
        Effect.catchTags({
          ApiInvalidRequest: () => Effect.succeed(c.json({}, 400)),
          UnknownUser: () => Effect.succeed(c.json({}, 404)),
          FormSpecNotFound: () => Effect.succeed(c.json({}, 404)),
          ParseError: () => Effect.succeed(c.json({}, 500)),
        })
      );

    return runWfApiEffect(program);
  }
);

export default userTemplatesApi;
