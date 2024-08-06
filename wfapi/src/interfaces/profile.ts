import { Schema as S } from "@effect/schema";

export const ProfileId = S.String.pipe(S.brand("ProfileId"));
export type ProfileId = S.Schema.Type<typeof ProfileId>;

export const Profile = S.Struct({
  id: ProfileId,
  email: S.String,
  displayName: S.String,
  givenName: S.optional(S.String),
  surname: S.optional(S.String),
  address: S.optional(S.String),
  telephone: S.optional(S.String),
  metadata: S.Struct({
    version: S.Number,
    photoId: S.optional(S.String),
    photoUrl: S.optional(S.String),
    photoThumbnailUrl: S.optional(S.String),
    photoRequired: S.Boolean,
    profileInformationRequired: S.Boolean,
  }),
});
export interface Profile extends S.Schema.Type<typeof Profile> {}
