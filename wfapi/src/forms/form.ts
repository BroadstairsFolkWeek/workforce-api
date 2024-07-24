import { Schema as S } from "@effect/schema";
import { ModelProfileId } from "../model/interfaces/profile";

export const FormProviderId = S.String.pipe(S.brand("FormProviderId"));
export type FormProviderId = S.Schema.Type<typeof FormProviderId>;

export const UserCreatableFormAction = S.Literal("create");
export type UserCreatableFormAction = S.Schema.Type<
  typeof UserCreatableFormAction
>;

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

export const FormProviderSpecId = S.String.pipe(S.brand("FormProviderSpecId"));
export type FormProviderSpecId = S.Schema.Type<typeof FormProviderSubmissionId>;

export const FormSpec = S.Struct({
  formProviderId: FormProviderId,
  formProviderSpecId: FormProviderSpecId,
  id: FormSpecId,
  shortName: S.String,
  fullName: S.String,
  description: S.String,
  questions: S.Unknown,
  requirements: FormSpecRequirements,
  status: S.Literal("draft", "active", "archived"),
});
export interface FormSpec extends S.Schema.Type<typeof FormSpec> {}

export const FormProviderSubmissionId = S.String.pipe(
  S.brand("FormProviderSubmissionId")
);
export type FormProviderSubmissionId = S.Schema.Type<
  typeof FormProviderSubmissionId
>;

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

export const FormSubmissionAction = S.Literal("submit", "retract");
export type FormSubmissionAction = S.Schema.Type<typeof FormSubmissionAction>;

export const FormAnswersModifiableStatus = S.Literal("modifiable", "locked");
export type FormAnswersModifiableStatus = S.Schema.Type<
  typeof FormAnswersModifiableStatus
>;

export const FormSubmissionDeleteableStatus = S.Literal(
  "deletable",
  "not-deletable"
);
export type FormSubmissionDeleteableStatus = S.Schema.Type<
  typeof FormSubmissionDeleteableStatus
>;

export const UnverifiedFormSubmission = S.Struct({
  formProviderId: FormProviderId,
  formProviderSubmissionId: FormProviderSubmissionId,
  id: FormSubmissionId,
  formSpecId: FormSpecId,
  profileId: ModelProfileId,
  answers: S.Unknown,
  submissionStatus: UnverifiedFormSubmissionStatus,
  archiveStatus: FormSubmissionArchiveStatus,
  createdDateTimeUtc: S.DateFromString,
  modifiedDateTimeUtc: S.DateFromString,
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
  answersModifiable: FormAnswersModifiableStatus,
  submissionDeletable: FormSubmissionDeleteableStatus,
});
export interface FormSubmission extends S.Schema.Type<typeof FormSubmission> {}

export const FormSubmissionWithSpec = S.Struct({
  ...FormSubmission.fields,
  formSpec: FormSpec,
});

export interface FormSubmissionWithSpec
  extends S.Schema.Type<typeof FormSubmissionWithSpec> {}

export const FormSubmissionWithSpecAndActions = FormSubmissionWithSpec.pipe(
  S.extend(S.Struct({ availableActions: S.Array(FormSubmissionAction) }))
);
export interface FormSubmissionWithSpecAndActions
  extends S.Schema.Type<typeof FormSubmissionWithSpecAndActions> {}
