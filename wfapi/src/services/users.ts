import { Effect } from "effect";
import {
  ModelAddableUserLogin,
  ModelCoreUserLogin,
  ModelUserId,
} from "../model/interfaces/user-login";
import { UserLoginRepository } from "../model/user-logins-repository";
import { ModelProfileId } from "../model/interfaces/profile";
import { deleteProfileByUserId } from "./profiles";

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

export const ensureUserLogin =
  (user: ModelCoreUserLogin) => (newProfileId: ModelProfileId) =>
    UserLoginRepository.pipe(
      Effect.andThen((repo) =>
        repo
          .modelGetUserLoginByIdentityProviderUserId(
            user.identityProviderUserId
          )
          .pipe(
            Effect.catchTag("UserLoginNotFound", () =>
              repo.modelCreateUserLogin({
                ...user,
                profileId: newProfileId,
              })
            )
          )
      )
    );

export const deleteUser = (userId: ModelUserId) =>
  UserLoginRepository.pipe(
    Effect.andThen((repo) => repo.modelDeleteUserByUserId(userId)),
    Effect.catchTag("UserLoginNotFound", () => Effect.fail(new UnknownUser()))
  ).pipe(
    Effect.andThen((deletedUserLogin) =>
      deleteProfileByUserId(deletedUserLogin.profileId)
    )
  );
