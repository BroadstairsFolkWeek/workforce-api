import { Schema as S } from "@effect/schema";
import { ApiProfile } from "./profiles";

export const PostUsersResponse = S.Struct({
  data: ApiProfile,
});
