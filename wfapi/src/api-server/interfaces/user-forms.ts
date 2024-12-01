import { Schema as S } from "@effect/schema";
import { z } from "zod";
import {
  Template,
  FormSubmissionWithSpecAndActions,
} from "../../interfaces/form";

export const putFormParamsSchema = z.object({
  userId: z.string().brand("UserId"),
  formSubmissionId: z.string().brand("FormSubmissionId"),
});

export const postFormParamsSchema = putFormParamsSchema;
export const deleteFormParamsSchema = putFormParamsSchema;

const ApiUserForm = FormSubmissionWithSpecAndActions;
const ApiUserTemplate = Template;

export const GetUserFormsResponse = S.Struct({
  data: S.Array(ApiUserForm),
});

export const UpdateUserFormRequest = S.Struct({
  answers: S.Unknown,
});

export const UpdateUserFormResponse = S.Struct({
  data: ApiUserForm,
});

export const ActionFormResponse = S.Struct({
  data: ApiUserForm,
});

export const GetCreatableFormSpecsResponse = S.Struct({
  data: S.Array(ApiUserTemplate),
});

export const PostUserCreatableFormNewFormRequest = S.Struct({
  answers: S.Unknown,
});

export const PostUserCreatableFormNewFormResponse = S.Struct({
  data: ApiUserForm,
});
