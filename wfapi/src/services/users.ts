import { Data, Effect } from "effect";
import {
  ModelPersistedUserLogin,
  ModelUserId,
} from "../model/interfaces/user-login";
import { UserLoginRepository } from "../model/user-logins-repository";
import {
  createProfile,
  deleteProfileByUserId,
  getProfileByProfileId,
} from "./profiles";
import { User, UserAndProfile } from "../interfaces/user";
import { ProfilesRepository } from "../model/profiles-repository";
import { PhotosRepository } from "../model/photos-repository";

export class UnknownUser extends Data.TaggedClass("UnknownUser")<{
  userId: string;
}> {}

const modelUserToUser = (modelUser: ModelPersistedUserLogin): User => {
  return {
    id: modelUser.id,
    displayName: modelUser.displayName,
    email: modelUser.email,
    metadata: {
      profileId: modelUser.profileId,
    },
  };
};

export const getUser = (
  userId: ModelUserId
): Effect.Effect<
  UserAndProfile,
  UnknownUser,
  UserLoginRepository | ProfilesRepository | PhotosRepository
> =>
  UserLoginRepository.pipe(
    Effect.andThen((repo) =>
      repo.modelGetUserLoginByIdentityProviderUserId(userId)
    ),
    Effect.andThen(modelUserToUser),
    Effect.andThen((user) =>
      getProfileByProfileId(user.metadata.profileId).pipe(
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
              profileId: profile.id,
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
