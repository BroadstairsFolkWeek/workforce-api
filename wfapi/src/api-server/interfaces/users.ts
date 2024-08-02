import { Schema as S } from "@effect/schema";
import { z } from "zod";

import { ApiProfile } from "./profiles";

const ApiUser = S.Struct({
  id: S.String,
  displayName: S.String,
  email: S.String,
});

const ApiUserAndProfile = S.Struct({
  user: ApiUser,
  profile: ApiProfile,
});

export const userIdParamSchema = z.object({
  userId: z.string().brand("UserId"),
});

export const GetUserResponse = S.Struct({
  data: ApiUserAndProfile,
});

export const PutUserPropertiesResponse = S.Struct({
  data: ApiUserAndProfile,
});

export const PostUsersResponse = S.Struct({
  data: ApiProfile,
});
