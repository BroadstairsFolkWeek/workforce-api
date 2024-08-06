import { Schema as S } from "@effect/schema";
import { ProfileId } from "../../interfaces/profile";

const ApiProfileMeta = S.Struct({
  photoRequired: S.Boolean,
  profileInformationRequired: S.Boolean,
  version: S.Number,
  photoUrl: S.optional(S.String),
  photoThumbnailUrl: S.optional(S.String),
});

export const ApiProfile = S.Struct({
  id: ProfileId,
  email: S.String,
  displayName: S.String,
  givenName: S.optional(S.String),
  surname: S.optional(S.String),
  address: S.optional(S.String),
  telephone: S.optional(S.String),
  metadata: ApiProfileMeta,
});

export const ApiProfileUpdates = ApiProfile.pipe(
  S.omit("id", "metadata"),
  S.partial
);

export interface ApiProfile extends S.Schema.Type<typeof ApiProfile> {}
export interface ApiProfileUpdates
  extends S.Schema.Type<typeof ApiProfileUpdates> {}

export const GetProfilesResponse = S.Struct({
  data: S.Array(ApiProfile),
});

export const GetProfileResponse = S.Struct({
  data: ApiProfile,
});

export const UpdateProfileResponse = S.Struct({
  data: ApiProfile,
});

export const SetProfilePhotoResponse = S.Struct({
  data: ApiProfile,
});

export interface GetProfileResponse
  extends S.Schema.Type<typeof GetProfileResponse> {}
export interface GetProfilesResponse
  extends S.Schema.Type<typeof GetProfilesResponse> {}

export interface SetProfilePhotoResponse
  extends S.Schema.Type<typeof SetProfilePhotoResponse> {}
