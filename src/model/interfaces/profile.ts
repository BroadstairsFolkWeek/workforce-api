import { Schema as S } from "@effect/schema";

export const ModelProfileId = S.String.pipe(S.brand("ProfileId"));
export type ModelProfileId = S.Schema.Type<typeof ModelProfileId>;

const ModelPhotoIds = S.split("\n");

const ModelCoreProfile = S.Struct({
  email: S.optional(S.String).pipe(S.fromKey("Email")),
  displayName: S.propertySignature(S.String).pipe(S.fromKey("Title")),
  givenName: S.optional(S.String).pipe(S.fromKey("GivenName")),
  surname: S.optional(S.String).pipe(S.fromKey("Surname")),
  address: S.optional(S.String).pipe(S.fromKey("Address")),
  telephone: S.optional(S.String).pipe(S.fromKey("Telephone")),
  version: S.propertySignature(S.Number).pipe(S.fromKey("Version")),
  photoIds: S.optional(ModelPhotoIds).pipe(S.fromKey("PhotoIds")),
});

const ModelProfileMetadata = S.Struct({
  profileId: S.propertySignature(ModelProfileId).pipe(S.fromKey("ProfileId")),
});

const ModelProfilePersistanceData = S.Struct({
  dbId: S.propertySignature(S.NumberFromString).pipe(S.fromKey("id")),
  createdDate: S.propertySignature(S.DateFromString).pipe(S.fromKey("Created")),
  modifiedDate: S.propertySignature(S.DateFromString).pipe(
    S.fromKey("Modified")
  ),
});

export const ModelAddableProfile = S.extend(
  ModelCoreProfile,
  ModelProfileMetadata
);

export const ModelPersistedProfile = S.extend(
  ModelCoreProfile,
  S.extend(ModelProfileMetadata, ModelProfilePersistanceData)
);

export interface ModelAddableProfile
  extends S.Schema.Type<typeof ModelAddableProfile> {}

export interface ModelPersistedProfile
  extends S.Schema.Type<typeof ModelPersistedProfile> {}

export interface ModelEncodedAddableProfile
  extends S.Schema.Encoded<typeof ModelAddableProfile> {}

export interface ModelEncodedPersistedProfile
  extends S.Schema.Encoded<typeof ModelPersistedProfile> {}
