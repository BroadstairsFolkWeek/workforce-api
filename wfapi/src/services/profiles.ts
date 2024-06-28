import { Effect } from "effect";
import { ModelUserId } from "../model/interfaces/user-login";
import { getUserLogin } from "./users";
import { ProfilesRepository } from "../model/profiles-repository";
import {
  ModelPersistedProfile,
  ModelProfileId,
} from "../model/interfaces/profile";
import {
  SupportedPhotoMimeType,
  addPhoto,
  getPhotoUrlForPhotoId,
} from "./photos";
import { PhotosRepository } from "../model/photos-repository";

interface Profile extends ModelPersistedProfile {
  photoUrl?: string;
}

const photoIdFromEncodedPhotoId = (encodedPhotoId: string) => {
  const splitIds = encodedPhotoId.split(":");
  if (splitIds.length > 1) {
    return splitIds[1];
  } else {
    return splitIds[0];
  }
};

const addPhotoUrlToProfile = (
  profile: ModelPersistedProfile
): Effect.Effect<Profile, never, PhotosRepository> => {
  if (profile.photoIds && profile.photoIds.length > 0) {
    const photoId = profile.photoIds[0];
    return getPhotoUrlForPhotoId(photoIdFromEncodedPhotoId(photoId)).pipe(
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

export const getProfileByProfileId = (profileId: ModelProfileId) =>
  ProfilesRepository.pipe(
    Effect.andThen((repo) => repo.modelGetProfileByProfileId(profileId))
  ).pipe(Effect.andThen(addPhotoUrlToProfile));

export const getProfiles = () =>
  ProfilesRepository.pipe(
    Effect.andThen((repo) => repo.modelGetProfiles())
  ).pipe(Effect.andThen(Effect.forEach(addPhotoUrlToProfile)));

export const setProfilePhoto = (
  profileId: ModelProfileId,
  mimeType: SupportedPhotoMimeType,
  content: Buffer
) =>
  getProfileByProfileId(profileId)
    .pipe(
      Effect.andThen((profile) =>
        addPhoto(mimeType, content, profile.displayName, profile.surname).pipe(
          Effect.andThen((photoId) =>
            ProfilesRepository.pipe(
              Effect.andThen((repo) =>
                repo.modelUpdateProfile(profileId, {
                  photoIds: [photoId],
                  version: profile.version + 1,
                })
              )
            )
          )
        )
      )
    )
    .pipe(Effect.andThen(addPhotoUrlToProfile));
