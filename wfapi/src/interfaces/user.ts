import { Schema as S } from "@effect/schema";
import { Profile, ProfileId } from "./profile";

export const UserId = S.String.pipe(S.brand("UserId"));
export type UserId = S.Schema.Type<typeof UserId>;

export const User = S.Struct({
  id: UserId,
  displayName: S.String,
  email: S.String,
  metadata: S.Struct({
    profileId: ProfileId,
  }),
});
export interface User extends S.Schema.Type<typeof User> {}

export const UserAndProfile = S.Struct({
  user: User,
  profile: Profile,
});
export interface UserAndProfile extends S.Schema.Type<typeof UserAndProfile> {}
