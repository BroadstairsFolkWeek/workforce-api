import { Schema as S } from "@effect/schema";
import { FormSpec, FormSubmissionWithSpecAndActions } from "../../forms/form";

const ApiForm = FormSubmissionWithSpecAndActions;
const ApiFormSpec = FormSpec;

export const GetUserFormsResponse = S.Struct({
  data: S.Array(ApiForm),
});

export const UpdateUserFormResponse = S.Struct({
  data: ApiForm,
});

export const ActionFormResponse = S.Struct({
  data: ApiForm,
});

export const GetCreatableFormSpecsResponse = S.Struct({
  data: S.Array(ApiFormSpec),
});

export const PostUserCreatableFormNewFormRequest = S.Struct({
  answers: S.Unknown,
});

export const PostUserCreatableFormNewFormResponse = S.Struct({
  data: ApiForm,
});
