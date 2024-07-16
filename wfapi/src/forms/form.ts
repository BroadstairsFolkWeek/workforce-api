import { Schema as S } from "@effect/schema";
import { ModelProfileId } from "../model/interfaces/profile";

const FormSpecRequirements = S.Struct({
  profileRequirements: S.Struct({
    firstName: S.optional(S.Boolean),
    surname: S.optional(S.Boolean),
    displayName: S.optional(S.Boolean),
    address: S.optional(S.Boolean),
    telephone: S.optional(S.Boolean),
    email: S.optional(S.Boolean),
    photo: S.optional(S.Boolean),
  }),
});

export const FormSpecId = S.String.pipe(S.brand("FormSpecId"));
export type FormSpecId = S.Schema.Type<typeof FormSpecId>;

export const FormSpec = S.Struct({
  id: FormSpecId,
  shortName: S.String,
  fullName: S.String,
  description: S.String,
  questions: S.Unknown,
  requirements: FormSpecRequirements,
  status: S.Literal("draft", "active", "archived"),
});
export interface FormSpec extends S.Schema.Type<typeof FormSpec> {}

export const FormSubmissionId = S.String.pipe(S.brand("FormSubmissionId"));
export type FormSubmissionId = S.Schema.Type<typeof FormSubmissionId>;

export const UnverifiedFormSubmissionStatus = S.Literal(
  "draft",
  "submittable",
  "submitted",
  "accepted"
);
export type UnverifiedFormSubmissionStatus = S.Schema.Type<
  typeof UnverifiedFormSubmissionStatus
>;

export const VerifiedFormSubmissionStatus = UnverifiedFormSubmissionStatus.pipe(
  S.brand("VerifiedFormSubmissionStatus")
);
export type VerifiedFormSubmissionStatus = S.Schema.Type<
  typeof VerifiedFormSubmissionStatus
>;

export const FormSubmissionArchiveStatus = S.Literal("active", "archived");
export type FormSubmissionArchiveStatus = S.Schema.Type<
  typeof FormSubmissionArchiveStatus
>;

export const FormSubmissionAvailableActions = S.Literal(
  "save",
  "submit",
  "retract"
);
export type FormSubmissionAvailableActions = S.Schema.Type<
  typeof FormSubmissionAvailableActions
>;

export const UnverifiedFormSubmission = S.Struct({
  id: FormSubmissionId,
  formSpecId: FormSpecId,
  profileId: ModelProfileId,
  answers: S.Unknown,
  submissionStatus: UnverifiedFormSubmissionStatus,
  archiveStatus: FormSubmissionArchiveStatus,
});
export interface UnverifiedFormSubmission
  extends S.Schema.Type<typeof UnverifiedFormSubmission> {}

export const UnverifiedFormSubmissionWithSpec = S.Struct({
  ...UnverifiedFormSubmission.fields,
  formSpec: FormSpec,
});
export interface UnverifiedFormSubmissionWithSpec
  extends S.Schema.Type<typeof UnverifiedFormSubmissionWithSpec> {}

export const FormSubmission = S.Struct({
  ...UnverifiedFormSubmissionWithSpec.fields,
  submissionStatus: VerifiedFormSubmissionStatus,
});
export interface FormSubmission extends S.Schema.Type<typeof FormSubmission> {}

export const FormSubmissionWithSpec = S.Struct({
  ...FormSubmission.fields,
  formSpec: FormSpec,
});

export interface FormSubmissionWithSpec
  extends S.Schema.Type<typeof FormSubmissionWithSpec> {}

export const FormSubmissionWithSpecAndActions = FormSubmissionWithSpec.pipe(
  S.extend(
    S.Struct({ availableActions: S.Array(FormSubmissionAvailableActions) })
  )
);
export interface FormSubmissionWithSpecAndActions
  extends S.Schema.Type<typeof FormSubmissionWithSpecAndActions> {}
