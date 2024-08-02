import { Schema as S } from "@effect/schema";
import { ModelProfileId } from "./profile";

export const ModelUserId = S.String.pipe(S.brand("UserId"));
export type ModelUserId = S.Schema.Type<typeof ModelUserId>;

export const ModelCoreUserLogin = S.Struct({
  id: S.propertySignature(ModelUserId).pipe(
    S.fromKey("IdentityProviderUserId")
  ),
  displayName: S.propertySignature(S.String).pipe(S.fromKey("Title")),
  email: S.propertySignature(S.String).pipe(S.fromKey("Email")),
});
export interface ModelCoreUserLogin
  extends S.Schema.Type<typeof ModelCoreUserLogin> {}

const ModelUserLoginMetadata = S.Struct({
  profileId: S.propertySignature(ModelProfileId).pipe(S.fromKey("ProfileId")),
});

const ModelUserLoginPersistanceData = S.Struct({
  dbId: S.propertySignature(S.NumberFromString).pipe(S.fromKey("id")),
  createdDate: S.propertySignature(S.DateFromString).pipe(S.fromKey("Created")),
  modifiedDate: S.propertySignature(S.DateFromString).pipe(
    S.fromKey("Modified")
  ),
});

export const ModelAddableUserLogin = S.extend(
  ModelCoreUserLogin,
  ModelUserLoginMetadata
);

export const ModelPersistedUserLogin = S.extend(
  ModelCoreUserLogin,
  S.extend(ModelUserLoginMetadata, ModelUserLoginPersistanceData)
);

export interface ModelPersistedUserLogin
  extends S.Schema.Type<typeof ModelPersistedUserLogin> {}

export interface ModelAddableUserLogin
  extends S.Schema.Type<typeof ModelAddableUserLogin> {}

export interface ModelEncodedPersistedUserLogin
  extends S.Schema.Encoded<typeof ModelPersistedUserLogin> {}
export interface ModelEncodedAddableUserLogin
  extends S.Schema.Encoded<typeof ModelAddableUserLogin> {}
