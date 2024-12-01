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
  UpdateUserFormRequest,
  UpdateUserFormResponse,
} from "./interfaces/user-forms";
import { runWfApiEffect } from "./effect-runner";
import { FormSubmissionAction, FormSubmissionId } from "../interfaces/form";
import { ApiInvalidRequest } from "./interfaces/api";
import { UserId } from "../interfaces/user";

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
      Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500)))
    );

  return runWfApiEffect(program);
});

userFormsApi.put(
  "/:formSubmissionId/answers",
  zValidator("param", putFormParamsSchema),
  async (c) => {
    const userIdEffect = S.decodeUnknown(UserId)(c.req.valid("param").userId);

    const formIdEffect = S.decodeUnknown(FormSubmissionId)(
      c.req.valid("param").formSubmissionId
    );

    const decodedRequestBodyEffect = Effect.tryPromise({
      try: () => c.req.json(),
      catch: (error) => new ApiInvalidRequest({ error }),
    })
      .pipe(
        Effect.andThen(S.decodeUnknown(UpdateUserFormRequest)),
        Effect.catchTag("ParseError", (error) =>
          Effect.fail(new ApiInvalidRequest({ error }))
        )
      )
      .pipe(
        Effect.tapErrorTag("ApiInvalidRequest", (e) =>
          Effect.logWarning(
            "Error parsing JSON body for user form answers PUT request",
            e.error
          )
        )
      );

    const program = Effect.all([
      userIdEffect,
      formIdEffect,
      decodedRequestBodyEffect,
    ])
      .pipe(
        Effect.andThen(([userId, formId, requestBody]) =>
          updateFormSubmissionForUserId(formId)(requestBody.answers)(userId)
        )
      )
      .pipe(
        Effect.andThen((formSubmission) => ({ data: formSubmission })),
        Effect.andThen(S.encode(UpdateUserFormResponse)),
        Effect.andThen((body) => c.json(body, 200))
      )
      .pipe(
        Effect.catchTags({
          ApiInvalidRequest: () => Effect.succeed(c.json({}, 400)),
          UnknownUser: () => Effect.succeed(c.json({}, 404)),
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
        Effect.catchTag("ParseError", (error) =>
          Effect.fail(new ApiInvalidRequest({ error }))
        ),
        Effect.andThen(([userId, formSubmissionId]) =>
          deleteFormSubmissionForUserId(formSubmissionId)(userId)
        ),
        Effect.andThen(() => Effect.succeed(c.body(null, 204)))
      )
      .pipe(
        Effect.catchTags({
          UnknownUser: () => Effect.succeed(c.json({}, 404)),
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
      catch: (error) => new ApiInvalidRequest({ error }),
    }).pipe(
      Effect.andThen(S.decodeUnknown(FormSubmissionAction)),
      Effect.catchTag("ParseError", (error) =>
        Effect.fail(new ApiInvalidRequest({ error }))
      )
    );

    const program = Effect.all([
      userIdEffect,
      formSubmissionIdEffect,
      actionEffect,
    ])
      .pipe(
        Effect.catchTag("ParseError", (error) =>
          Effect.fail(new ApiInvalidRequest({ error }))
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
