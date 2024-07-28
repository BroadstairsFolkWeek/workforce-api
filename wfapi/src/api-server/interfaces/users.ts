import { Schema as S } from "@effect/schema";
import { z } from "zod";

import { ApiProfile } from "./profiles";

export const userIdParamSchema = z.object({
  userId: z.string().brand("UserId"),
});

export const PostUsersResponse = S.Struct({
  data: ApiProfile,
});
