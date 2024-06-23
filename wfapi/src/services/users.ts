import { Effect } from "effect";
import { ModelUserId } from "../model/interfaces/user-login";
import { UserLoginRepository } from "../model/user-logins-repository";

export class UnknownUser {
  readonly _tag = "UnknownUser";
}

export const getUserLogin = (userId: ModelUserId) =>
  UserLoginRepository.pipe(
    Effect.andThen((repo) =>
      repo.modelGetUserLoginByIdentityProviderUserId(userId)
    ),

    Effect.catchTag("UserLoginNotFound", () => Effect.fail(new UnknownUser()))
  );
