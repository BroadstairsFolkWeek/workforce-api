import { Schema as S } from "@effect/schema";

export const ModelProfileId = S.String.pipe(S.brand("ProfileId"));
export type ModelProfileId = S.Schema.Type<typeof ModelProfileId>;

const ModelCorePhoto = S.Struct({
  title: S.propertySignature(S.String).pipe(S.fromKey("Title")),
  givenName: S.optional(S.String).pipe(S.fromKey("GivenName")),
  surname: S.optional(S.String).pipe(S.fromKey("Surname")),
  applicationId: S.optional(S.String).pipe(S.fromKey("ApplicationId")),
  profileId: S.optional(S.String).pipe(S.fromKey("ProfileId")),
});

const ModelPhotoMetadata = S.Struct({
  photoId: S.propertySignature(ModelProfileId).pipe(S.fromKey("PhotoId")),
});

const ModelPhotoPersistanceData = S.Struct({
  dbId: S.propertySignature(S.NumberFromString).pipe(S.fromKey("id")),
  createdDate: S.propertySignature(S.DateFromString).pipe(S.fromKey("Created")),
  modifiedDate: S.propertySignature(S.DateFromString).pipe(
    S.fromKey("Modified")
  ),
});

export const ModelAddablePhoto = S.extend(ModelCorePhoto, ModelPhotoMetadata);

export const ModelPhotoChanges = S.Struct({
  title: S.optional(S.String).pipe(S.fromKey("Title")),
  givenName: S.optional(S.NullOr(S.String)).pipe(S.fromKey("GivenName")),
  surname: S.optional(S.NullOr(S.String)).pipe(S.fromKey("Surname")),
  applicationId: S.optional(S.NullOr(S.String)).pipe(
    S.fromKey("ApplicationId")
  ),
  profileId: S.optional(S.NullOr(S.String)).pipe(S.fromKey("ProfileId")),
});

export const ModelPersistedPhoto = S.extend(
  ModelCorePhoto,
  S.extend(ModelPhotoMetadata, ModelPhotoPersistanceData)
);

export interface ModelAddablePhoto
  extends S.Schema.Type<typeof ModelAddablePhoto> {}

export interface ModelPhotoChanges
  extends S.Schema.Type<typeof ModelPhotoChanges> {}

export interface ModelPersistedPhoto
  extends S.Schema.Type<typeof ModelPersistedPhoto> {}

export interface ModelEncodedAddablePhoto
  extends S.Schema.Encoded<typeof ModelAddablePhoto> {}

export interface ModelEncodedPhotoChanges
  extends S.Schema.Encoded<typeof ModelPhotoChanges> {}

export interface ModelEncodedPersistedPhoto
  extends S.Schema.Encoded<typeof ModelPersistedPhoto> {}
