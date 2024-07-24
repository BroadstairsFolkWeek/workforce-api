import { Effect, Match } from "effect";
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
  ensureProfileByUserLoginDetails,
  getProfileByUserId,
  setProfilePhoto,
  updateProfileByUserId,
} from "../services/profiles";
import { ModelUserId } from "../model/interfaces/user-login";
import { repositoriesLayerLive } from "../contexts/repositories-live";
import { logLevelLive } from "../util/logging";
import {
  ActionFormResult,
  createFormSubmissionForUserId,
  deleteFormSubmissionForUserId,
  executeFormSubmissionActionForUserId,
  getCreatableFormsByUserId,
  getFormsByUserId,
  updateFormSubmissionForUserId,
} from "../forms/forms";
import {
  ActionFormResponse,
  GetCreatableFormSpecsResponse,
  GetUserFormsResponse,
  PostUserCreatableFormNewFormRequest,
  PostUserCreatableFormNewFormResponse,
  UpdateUserFormResponse,
} from "./interfaces/forms";
import { formsLayerLive } from "../contexts/forms-live";
import { PostUsersResponse } from "./interfaces/users";
import { deleteUser } from "../services/users";
import {
  FormSpecId,
  FormSubmissionAction,
  FormSubmissionId,
} from "../forms/form";
import { ApiInvalidRequest } from "./interfaces/api";

const userIdParamSchema = z.object({ userId: z.string().brand("UserId") });
const putFormParamsSchema = z.object({
  userId: z.string().brand("UserId"),
  formSubmissionId: z.string().brand("FormSubmissionId"),
});
const postFormParamsSchema = putFormParamsSchema;
const deleteFormParamsSchema = putFormParamsSchema;

const postCreatableFormParamsSchema = z.object({
  userId: z.string().brand("UserId"),
  formSpecId: z.string().brand("FormSpecId"),
});

const postUsersBodySchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  givenName: z.string().optional(),
  surname: z.string().optional(),
  email: z.string().optional(),
});

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

usersApi.post("/", zValidator("json", postUsersBodySchema), async (c) => {
  const requestBody = c.req.valid("json");

  const addableUser = {
    ...requestBody,
    identityProviderUserId: ModelUserId.make(requestBody.userId),
  };

  const program = ensureProfileByUserLoginDetails(addableUser)
    .pipe(
      Effect.tap((profile) =>
        Effect.logInfo(
          `Created or retrieved profile for user: ${requestBody.userId}`,
          profile
        )
      ),
      Effect.andThen((profile) => ({ data: profile })),
      Effect.andThen(S.encode(PostUsersResponse)),
      Effect.tap((postUsersResponse) =>
        Effect.logTrace(
          "Reporting successful profile ensurance",
          postUsersResponse
        )
      ),
      Effect.andThen((body) => c.json(body, 200))
    )
    .pipe(
      Effect.catchTags({
        ParseError: () => Effect.succeed(c.json({}, 500)),
      })
    );

  const runnable = program.pipe(
    Effect.provide(repositoriesLayerLive),
    Effect.provide(logLevelLive)
  );

  return await Effect.runPromise(runnable);
});

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
        Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500)))
      );

    const runnable = getFormsProgram.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(formsLayerLive),
      Effect.provide(logLevelLive)
    );

    return await Effect.runPromise(runnable);
  }
);

usersApi.get(
  "/:userId/profile/creatableforms",
  zValidator("param", userIdParamSchema),
  async (c) => {
    const { userId } = c.req.valid("param");

    const getFormsProgram = getCreatableFormsByUserId(ModelUserId.make(userId!))
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
        Effect.catchTag("ProfileNotFound", () =>
          Effect.succeed(c.json({}, 404))
        ),
        Effect.catchTag("ParseError", (e) => Effect.succeed(c.json({}, 500)))
      );

    const runnable = getFormsProgram.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(formsLayerLive),
      Effect.provide(logLevelLive)
    );

    return await Effect.runPromise(runnable);
  }
);

usersApi.post(
  "/:userId/profile/creatableforms/:formSpecId/create",
  zValidator("param", postCreatableFormParamsSchema),
  async (c) => {
    const userIdEffect = S.decodeUnknown(ModelUserId)(
      c.req.valid("param").userId
    );

    const formSpecIdEffect = S.decodeUnknown(FormSpecId)(
      c.req.valid("param").formSpecId
    );

    const decodedRequestBody = Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => new ApiInvalidRequest(),
    }).pipe(
      Effect.andThen(S.decodeUnknown(PostUserCreatableFormNewFormRequest)),
      Effect.catchTag("ParseError", () => Effect.fail(new ApiInvalidRequest()))
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
          ProfileNotFound: () => Effect.succeed(c.json({}, 404)),
          FormSpecNotFound: () => Effect.succeed(c.json({}, 404)),
          ParseError: () => Effect.succeed(c.json({}, 500)),
        })
      );

    const runnable = program.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(formsLayerLive),
      Effect.provide(logLevelLive)
    );

    return await Effect.runPromise(runnable);
  }
);

usersApi.put(
  "/:userId/profile/forms/:formSubmissionId",
  zValidator("param", putFormParamsSchema),
  async (c) => {
    const { userId, formSubmissionId } = c.req.valid("param");
    const answers = await c.req.json();

    const getFormsProgram = updateFormSubmissionForUserId(
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

    const runnable = getFormsProgram.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(formsLayerLive),
      Effect.provide(logLevelLive)
    );

    return await Effect.runPromise(runnable);
  }
);

usersApi.delete(
  "/:userId/profile/forms/:formSubmissionId",
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

    const runnable = program.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(formsLayerLive),
      Effect.provide(logLevelLive)
    );

    return await Effect.runPromise(runnable);
  }
);

usersApi.post(
  "/:userId/profile/forms/:formSubmissionId/action",
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

    const runnable = program.pipe(
      Effect.provide(repositoriesLayerLive),
      Effect.provide(formsLayerLive),
      Effect.provide(logLevelLive)
    );

    return await Effect.runPromise(runnable);
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
