import { Effect } from "effect";
import { ModelUserId } from "../model/interfaces/user-login";
import { getUserLogin } from "./users";
import { ProfilesRepository } from "../model/profiles-repository";
import { ModelPersistedProfile } from "../model/interfaces/profile";
import { getPhotoUrlForPhotoId } from "./photos";
import { PhotosRepository } from "../model/photos-repository";

interface Profile extends ModelPersistedProfile {
  photoUrl?: string;
}

const addPhotoUrlToProfile = (
  profile: ModelPersistedProfile
): Effect.Effect<Profile, never, PhotosRepository> => {
  if (profile.photoIds && profile.photoIds.length > 0) {
    const photoId = profile.photoIds[0];
    return getPhotoUrlForPhotoId(photoId).pipe(
      Effect.andThen((photoUrl) => {
        return {
          ...profile,
          photoUrl: photoUrl.href,
        };
      })
    );
  } else {
    return Effect.succeed(profile);
  }
};

export const getProfileByUserId = (userId: ModelUserId) =>
  getUserLogin(userId)
    .pipe(
      Effect.andThen((userLogin) =>
        ProfilesRepository.pipe(
          Effect.andThen((repo) =>
            repo.modelGetProfileByProfileId(userLogin.profileId)
          )
        )
      )
    )
    .pipe(Effect.andThen(addPhotoUrlToProfile));

export const getProfiles = () =>
  ProfilesRepository.pipe(
    Effect.andThen((repo) => repo.modelGetProfiles())
  ).pipe(Effect.andThen(Effect.forEach(addPhotoUrlToProfile)));
