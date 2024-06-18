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
});

export interface ApiProfile extends S.Schema.Type<typeof ApiProfile> {}

export const GetProfilesResponse = S.Array(ApiProfile);

export interface GetProfilesResponse
  extends S.Schema.Type<typeof GetProfilesResponse> {}
