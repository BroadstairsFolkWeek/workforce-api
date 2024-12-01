import { Schema as S } from "@effect/schema";
import {
  LayoutItem,
  OtherDataRequirements,
  TemplateConstraints,
  TemplateId,
  TemplateStatus,
} from "../../interfaces/form";

const ModelCoreTemplate = S.Struct({
  version: S.propertySignature(S.Number).pipe(S.fromKey("TemplateVersion")),
  status: S.propertySignature(TemplateStatus).pipe(S.fromKey("TemplateStatus")),
  shortName: S.propertySignature(S.String).pipe(S.fromKey("ShortName")),
  fullName: S.propertySignature(S.String).pipe(S.fromKey("FullName")),
  description: S.optional(S.String).pipe(S.fromKey("Description")),
  questions: S.propertySignature(S.parseJson()).pipe(S.fromKey("Questions")),
  otherDataRequirements: S.propertySignature(
    S.parseJson(OtherDataRequirements)
  ).pipe(S.fromKey("OtherDataRequirements")),
  constraints: S.propertySignature(S.parseJson(TemplateConstraints)).pipe(
    S.fromKey("Constraints")
  ),
  listItemLayout: S.propertySignature(S.parseJson(LayoutItem)).pipe(
    S.fromKey("ListItemLayout")
  ),
  detailsLayout: S.propertySignature(S.parseJson(LayoutItem)).pipe(
    S.fromKey("DetailsLayout")
  ),
});

const ModelTemplateMetadata = S.Struct({
  id: S.propertySignature(TemplateId).pipe(S.fromKey("Title")),
});

const ModelTemplatePersistanceData = S.Struct({
  dbId: S.propertySignature(S.NumberFromString).pipe(S.fromKey("id")),
  createdDate: S.propertySignature(S.DateFromString).pipe(S.fromKey("Created")),
  modifiedDate: S.propertySignature(S.DateFromString).pipe(
    S.fromKey("Modified")
  ),
});

export const ModelTemplateUpdates = S.partial(ModelCoreTemplate);

export const ModelAddableTemplate = S.extend(
  ModelCoreTemplate,
  ModelTemplateMetadata
);

export const ModelPersistedTemplate = S.extend(
  ModelCoreTemplate,
  S.extend(ModelTemplateMetadata, ModelTemplatePersistanceData)
);

export interface ModelTemplateUpdates
  extends S.Schema.Type<typeof ModelTemplateUpdates> {}

export interface ModelAddableTemplate
  extends S.Schema.Type<typeof ModelAddableTemplate> {}

export interface ModelPersistedTemplate
  extends S.Schema.Type<typeof ModelPersistedTemplate> {}

export interface ModelEncodedTemplateUpdates
  extends S.Schema.Encoded<typeof ModelTemplateUpdates> {}

export interface ModelEncodedAddableTemplate
  extends S.Schema.Encoded<typeof ModelAddableTemplate> {}

export interface ModelEncodedPersistedTemplate
  extends S.Schema.Encoded<typeof ModelPersistedTemplate> {}
