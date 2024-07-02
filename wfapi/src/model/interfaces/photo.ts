import { Schema as S } from "@effect/schema";

export const ModelPhotoId = S.String.pipe(S.brand("PhotoId"));
export type ModelPhotoId = S.Schema.Type<typeof ModelPhotoId>;

const ModelCorePhoto = S.Struct({
  title: S.propertySignature(S.String).pipe(S.fromKey("Title")),
  givenName: S.optional(S.String).pipe(S.fromKey("GivenName")),
  surname: S.optional(S.String).pipe(S.fromKey("Surname")),
});

const ModelPhotoMetadata = S.Struct({
  photoId: S.propertySignature(ModelPhotoId).pipe(S.fromKey("PhotoId")),
});

const ModelPhotoPersistanceData = S.Struct({
  dbId: S.propertySignature(S.NumberFromString).pipe(S.fromKey("id")),
  createdDate: S.propertySignature(S.DateFromString).pipe(S.fromKey("Created")),
  modifiedDate: S.propertySignature(S.DateFromString).pipe(
    S.fromKey("Modified")
  ),
});

export const ModelAddablePhoto = S.extend(ModelCorePhoto, ModelPhotoMetadata);

export const ModelPhoto = S.extend(
  ModelAddablePhoto,
  ModelPhotoPersistanceData
);

export interface ModelPhotoUrls {
  photoUrl: URL;
  photoThumbnailUrl: URL;
}

export interface ModelAddablePhoto
  extends S.Schema.Type<typeof ModelAddablePhoto> {}

export interface ModelPhoto extends S.Schema.Type<typeof ModelPhoto> {}

export interface ModelEncodedPhoto
  extends S.Schema.Encoded<typeof ModelPhoto> {}

export interface ModelEncodedAddablePhoto
  extends S.Schema.Encoded<typeof ModelAddablePhoto> {}
