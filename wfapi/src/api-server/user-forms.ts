import { Effect, Match } from "effect";
import { Schema as S } from "@effect/schema";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { userIdParamSchema } from "./interfaces/users";
import {
  ActionFormResult,
  deleteFormSubmissionForUserId,
  executeFormSubmissionActionForUserId,
  getFormsByUserId,
  updateFormSubmissionForUserId,
} from "../forms/forms";
import { ModelUserId } from "../model/interfaces/user-login";
import {
  ActionFormResponse,
  deleteFormParamsSchema,
  GetUserFormsResponse,
  postFormParamsSchema,
  putFormParamsSchema,
  UpdateUserFormResponse,
} from "./interfaces/user-forms";
import { runWfApiEffect } from "./effect-runner";
import { FormSubmissionAction, FormSubmissionId } from "../forms/form";
import { ApiInvalidRequest } from "./interfaces/api";

const userFormsApi = new Hono();

userFormsApi.get("/", zValidator("param", userIdParamSchema), async (c) => {
  const { userId } = c.req.valid("param");

  const program = getFormsByUserId(ModelUserId.make(userId!))
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
      Effect.catchTag("ProfileNotFound", () => Effect.succeed(c.json({}, 404))),
      Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500)))
    );

  return runWfApiEffect(program);
});

userFormsApi.put(
  "/:formSubmissionId",
  zValidator("param", putFormParamsSchema),
  async (c) => {
    const { userId, formSubmissionId } = c.req.valid("param");
    const answers = await c.req.json();

    const program = updateFormSubmissionForUserId(
      FormSubmissionId.make(formSubmissionId)
    )(answers)(ModelUserId.make(userId))
      .pipe(
        Effect.andThen((formSubmission) => ({ data: formSubmission })),
        Effect.andThen(S.encode(UpdateUserFormResponse)),
        Effect.andThen((body) => c.json(body, 200))
      )
      .pipe(
        Effect.catchTags({
          UnknownUser: () => Effect.succeed(c.json({}, 404)),
          ProfileNotFound: () => Effect.succeed(c.json({}, 404)),
          FormSubmissionNotFound: () => Effect.succeed(c.json({}, 404)),
          ParseError: () => Effect.succeed(c.json({}, 500)),
        })
      );

    return runWfApiEffect(program);
  }
);

userFormsApi.delete(
  "/:formSubmissionId",
  zValidator("param", deleteFormParamsSchema),
  async (c) => {
    const userIdEffect = S.decodeUnknown(ModelUserId)(
      c.req.valid("param").userId
    );

    const formSubmissionIdEffect = S.decodeUnknown(FormSubmissionId)(
      c.req.valid("param").formSubmissionId
    );

    const program = Effect.all([userIdEffect, formSubmissionIdEffect])
      .pipe(
        Effect.catchTag("ParseError", () =>
          Effect.fail(new ApiInvalidRequest())
        ),
        Effect.andThen(([userId, formSubmissionId]) =>
          deleteFormSubmissionForUserId(formSubmissionId)(userId)
        ),
        Effect.andThen(() => Effect.succeed(c.body(null, 204)))
      )
      .pipe(
        Effect.catchTags({
          UnknownUser: () => Effect.succeed(c.json({}, 404)),
          ProfileNotFound: () => Effect.succeed(c.json({}, 404)),
          FormSubmissionNotFound: () => Effect.succeed(c.json({}, 404)),
          ApiInvalidRequest: () => Effect.succeed(c.json({}, 400)),
        })
      );

    return runWfApiEffect(program);
  }
);

userFormsApi.post(
  "/:formSubmissionId/action",
  zValidator("param", postFormParamsSchema),
  async (c) => {
    const userIdEffect = S.decodeUnknown(ModelUserId)(
      c.req.valid("param").userId
    );

    const formSubmissionIdEffect = S.decodeUnknown(FormSubmissionId)(
      c.req.valid("param").formSubmissionId
    );

    const actionEffect = Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => new ApiInvalidRequest(),
    }).pipe(
      Effect.andThen(S.decodeUnknown(FormSubmissionAction)),
      Effect.catchTag("ParseError", () => Effect.fail(new ApiInvalidRequest()))
    );

    const program = Effect.all([
      userIdEffect,
      formSubmissionIdEffect,
      actionEffect,
    ])
      .pipe(
        Effect.catchTag("ParseError", () =>
          Effect.fail(new ApiInvalidRequest())
        ),
        Effect.andThen(([userId, formSubmissionId, action]) =>
          executeFormSubmissionActionForUserId(formSubmissionId)(userId)(action)
        ),
        Effect.andThen(
          Match.type<ActionFormResult>().pipe(
            Match.tag("ActionResultStatusUpdated", (result) =>
              Effect.succeed(result.formSubmission).pipe(
                Effect.andThen((formSubmission) => ({ data: formSubmission })),
                Effect.andThen(S.encode(ActionFormResponse)),
                Effect.andThen((body) => c.json(body, 200))
              )
            ),
            Match.exhaustive
          )
        )
      )
      .pipe(
        Effect.catchTags({
          UnknownUser: () => Effect.succeed(c.json({}, 404)),
          ProfileNotFound: () => Effect.succeed(c.json({}, 404)),
          FormSubmissionNotFound: () => Effect.succeed(c.json({}, 404)),
          UnprocessableFormAction: () => Effect.succeed(c.json({}, 422)),
          ApiInvalidRequest: () => Effect.succeed(c.json({}, 400)),
          ParseError: () => Effect.succeed(c.json({}, 500)),
        })
      );

    return runWfApiEffect(program);
  }
);

export default userFormsApi;
