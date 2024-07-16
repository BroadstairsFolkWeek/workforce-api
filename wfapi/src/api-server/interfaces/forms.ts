import { Schema as S } from "@effect/schema";
import { FormSubmissionWithSpecAndActions } from "../../forms/form";

const ApiForm = FormSubmissionWithSpecAndActions;

export const GetUserFormsResponse = S.Struct({
  data: S.Array(ApiForm),
});
