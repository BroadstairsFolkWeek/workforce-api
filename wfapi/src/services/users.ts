import { Data, Effect } from "effect";
import {
  ModelCoreUserLogin,
  ModelUserId,
} from "../model/interfaces/user-login";
import { UserLoginRepository } from "../model/user-logins-repository";
import { ModelProfileId } from "../model/interfaces/profile";
import {
  createProfile,
  deleteProfileByUserId,
  getProfileByProfileId,
} from "./profiles";

export class UnknownUser extends Data.TaggedClass("UnknownUser")<{
  userId: string;
}> {}

export const getUser = (userId: ModelUserId) =>
  UserLoginRepository.pipe(
    Effect.andThen((repo) =>
      repo.modelGetUserLoginByIdentityProviderUserId(userId)
    ),
    Effect.andThen((user) =>
      getProfileByProfileId(user.profileId).pipe(
        Effect.andThen((profile) => Effect.succeed({ user, profile }))
      )
    )
  ).pipe(
    Effect.catchTags({
      UserLoginNotFound: () => Effect.fail(new UnknownUser({ userId })),
      ProfileNotFound: (e) =>
        Effect.logError(
          `Data inconsistency error: User exists but profile does not. User ID: ${userId}. Profile ID: ${e.profileId}`
        ).pipe(Effect.andThen(Effect.die(e))),
    })
  );

const createUserAndProfile = (
  userId: ModelUserId,
  displayName: string,
  email: string
) =>
  createProfile(displayName, email).pipe(
    Effect.andThen((profile) =>
      UserLoginRepository.pipe(
        Effect.andThen((repo) =>
          repo
            .modelCreateUserLogin({
              id: userId,
              displayName,
              email,
              profileId: profile.profileId,
            })
            .pipe(Effect.andThen((user) => Effect.succeed({ user, profile })))
        )
      )
    )
  );

export const ensureUser = (
  userId: ModelUserId,
  displayName: string,
  email: string
) =>
  getUser(userId).pipe(
    Effect.catchTag("UnknownUser", () =>
      createUserAndProfile(userId, displayName, email)
    )
  );

export const deleteUser = (userId: ModelUserId) =>
  UserLoginRepository.pipe(
    Effect.andThen((repo) => repo.modelDeleteUserByUserId(userId)),
    Effect.catchTag("UserLoginNotFound", () =>
      Effect.fail(new UnknownUser({ userId }))
    )
  ).pipe(
    Effect.andThen((deletedUserLogin) =>
      deleteProfileByUserId(deletedUserLogin.profileId)
    )
  );
