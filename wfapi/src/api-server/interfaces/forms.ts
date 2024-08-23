import { Schema as S } from "@effect/schema";
import { FormSubmissionWithSpecAndActions } from "../../forms/form";
import { WithProfile } from "../../interfaces/profile";

const ApiForm = S.Struct({
  ...FormSubmissionWithSpecAndActions.fields,
  ...WithProfile.fields,
});

export const GetFormsResponse = S.Struct({
  data: S.Array(ApiForm),
});
