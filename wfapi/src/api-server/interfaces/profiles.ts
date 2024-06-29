import { Schema as S } from "@effect/schema";
import { ModelProfileId } from "../../model/interfaces/profile";

const ApiProfile = S.Struct({
  profileId: ModelProfileId,
  email: S.optional(S.String),
  displayName: S.String,
  givenName: S.optional(S.String),
  surname: S.optional(S.String),
  address: S.optional(S.String),
  telephone: S.optional(S.String),
  version: S.Number,
  photoUrl: S.optional(S.String),
  photoId: S.optional(S.String),
  dbId: S.Number,
});

export const ApiProfileUpdates = ApiProfile.pipe(
  S.omit("profileId", "version", "dbId", "photoUrl", "photoId"),
  S.partial()
);

export interface ApiProfile extends S.Schema.Type<typeof ApiProfile> {}
export interface ApiProfileUpdates
  extends S.Schema.Type<typeof ApiProfileUpdates> {}

export const GetProfileResponse = ApiProfile;
export const GetProfilesResponse = S.Array(ApiProfile);

export const SetProfilePhotoResponse = ApiProfile;

export interface GetProfileResponse
  extends S.Schema.Type<typeof GetProfileResponse> {}
export interface GetProfilesResponse
  extends S.Schema.Type<typeof GetProfilesResponse> {}

export interface SetProfilePhotoResponse
  extends S.Schema.Type<typeof SetProfilePhotoResponse> {}
