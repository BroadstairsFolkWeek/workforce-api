import { Schema as S } from "@effect/schema";
import { ModelProfileId } from "../model/interfaces/profile";

export const FormProviderId = S.String.pipe(S.brand("FormProviderId"));
export type FormProviderId = S.Schema.Type<typeof FormProviderId>;

export const UserCreatableFormAction = S.Literal("create");
export type UserCreatableFormAction = S.Schema.Type<
  typeof UserCreatableFormAction
>;

export const OtherDataRequirements = S.Struct({
  profileRequirements: S.Array(S.String),
  profilePhotoRequired: S.optional(S.Boolean),
});
export interface OtherDataRequirements
  extends S.Schema.Type<typeof OtherDataRequirements> {}

export const TemplateId = S.String.pipe(S.brand("TemplateId"));
export type TemplateId = S.Schema.Type<typeof TemplateId>;

export const FormProviderSpecId = S.String.pipe(S.brand("FormProviderSpecId"));
export type FormProviderSpecId = S.Schema.Type<typeof FormProviderSubmissionId>;

const NonRecursiveLayoutItem = S.Union(
  S.TaggedStruct("Answer", { questionId: S.String }),
  S.TaggedStruct("OtherDataProfilePhoto", {}),
  S.TaggedStruct("OtherDataProfile", { profileRequirement: S.String })
);

type LayoutItem =
  | S.Schema.Type<typeof NonRecursiveLayoutItem>
  | {
      _tag: "Group";
      orientation: "horizontal" | "vertical";
      items: readonly LayoutItem[];
    };
export const LayoutItem = S.Union(
  ...NonRecursiveLayoutItem.members,
  S.TaggedStruct("Group", {
    orientation: S.Literal("horizontal", "vertical"),
    items: S.Array(S.suspend((): S.Schema<LayoutItem> => LayoutItem)),
  })
);

export const TemplateConstraints = S.Struct({
  maxFormsPerProfile: S.Number,
});

export const TemplateStatus = S.Literal("draft", "active", "archived");

export const Template = S.Struct({
  id: TemplateId,
  version: S.Number,
  shortName: S.String,
  fullName: S.String,
  description: S.optional(S.String),
  questions: S.Unknown,
  otherDataRequirements: OtherDataRequirements,
  constraints: TemplateConstraints,
  status: TemplateStatus,
  listItemLayout: LayoutItem,
  detailsLayout: LayoutItem,
});
export interface Template extends S.Schema.Type<typeof Template> {}

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
  templateId: TemplateId,
  profileId: ModelProfileId,
  answers: S.Unknown,
  otherData: S.Unknown,
  submissionStatus: UnverifiedFormSubmissionStatus,
  archiveStatus: FormSubmissionArchiveStatus,
  createdDateTimeUtc: S.DateFromString,
  modifiedDateTimeUtc: S.DateFromString,
});
export interface UnverifiedFormSubmission
  extends S.Schema.Type<typeof UnverifiedFormSubmission> {}

export const UnverifiedFormSubmissionWithSpec = S.Struct({
  ...UnverifiedFormSubmission.fields,
  template: Template,
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
  template: Template,
});
export interface FormSubmissionWithSpec
  extends S.Schema.Type<typeof FormSubmissionWithSpec> {}

export const FormSubmissionWithSpecAndActions = S.Struct({
  ...FormSubmissionWithSpec.fields,
  availableActions: S.Array(FormSubmissionAction),
});

export interface FormSubmissionWithSpecAndActions
  extends S.Schema.Type<typeof FormSubmissionWithSpecAndActions> {}
