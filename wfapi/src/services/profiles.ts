import { Effect } from "effect";
import { ModelUserId } from "../model/interfaces/user-login";
import { getUserLogin } from "./users";
import { ProfilesRepository } from "../model/profiles-repository";
import {
  ModelPersistedProfile,
  ModelProfileId,
  ModelProfileUpdates,
} from "../model/interfaces/profile";
import {
  SupportedPhotoMimeType,
  addPhoto,
  getPhotoUrlsForPhotoId,
} from "./photos";
import { PhotosRepository } from "../model/photos-repository";

export class ProfileVersionMismatch {
  readonly _tag = "ProfileVersionMismatch";
}

interface ProfileWithPhoto extends ModelPersistedProfile {
  photoUrl?: string;
  photoThumbnailUrl?: string;
}

interface ProfileWithPhotoAndMetadata extends ProfileWithPhoto {
  meta: {
    photoRequired: boolean;
    profileInformationRequried: boolean;
  };
}

interface ProfileUpdates
  extends Omit<ModelProfileUpdates, "version" | "photoIds"> {}

const photoIdFromEncodedPhotoId = (encodedPhotoId: string) => {
  const splitIds = encodedPhotoId.split(":");
  if (splitIds.length > 1) {
    return splitIds[1];
  } else {
    return splitIds[0];
  }
};

const addPhotoUrlsToProfile = (
  profile: ModelPersistedProfile
): Effect.Effect<ProfileWithPhoto, never, PhotosRepository> => {
  if (profile.photoIds && profile.photoIds.length > 0) {
    const photoId = profile.photoIds[0];
    return getPhotoUrlsForPhotoId(photoIdFromEncodedPhotoId(photoId)).pipe(
      Effect.andThen((photoUrls) => {
        return {
          ...profile,
          photoUrl: photoUrls.photoUrl.href,
          photoThumbnailUrl: photoUrls.photoThumbnailUrl.href,
        };
      })
    );
  } else {
    return Effect.succeed(profile);
  }
};

const profileInformationMissing = (userProfile: ModelPersistedProfile) => {
  return (
    !userProfile.displayName ||
    !userProfile.givenName ||
    !userProfile.surname ||
    !userProfile.address ||
    !userProfile.telephone
  );
};

const addMetadataToProfile = (
  profile: ProfileWithPhoto
): ProfileWithPhotoAndMetadata => {
  return {
    ...profile,
    meta: {
      photoRequired: !profile.photoUrl,
      profileInformationRequried: profileInformationMissing(profile),
    },
  };
};

const decorateProfile = (
  profile: ModelPersistedProfile
): Effect.Effect<ProfileWithPhotoAndMetadata, never, PhotosRepository> =>
  addPhotoUrlsToProfile(profile).pipe(Effect.andThen(addMetadataToProfile));

export const getProfileByUserId = (userId: ModelUserId) =>
  getUserLogin(userId)
    .pipe(
      Effect.tap((userLogin) =>
        Effect.logTrace(`Found login for user: ${userId}`, userLogin)
      ),
      Effect.andThen((userLogin) =>
        ProfilesRepository.pipe(
          Effect.andThen((repo) =>
            repo.modelGetProfileByProfileId(userLogin.profileId)
          )
        )
      )
    )
    .pipe(Effect.andThen(decorateProfile));

export const getProfileByProfileId = (profileId: ModelProfileId) =>
  ProfilesRepository.pipe(
    Effect.andThen((repo) => repo.modelGetProfileByProfileId(profileId))
  ).pipe(Effect.andThen(decorateProfile));

export const getProfiles = () =>
  ProfilesRepository.pipe(
    Effect.andThen((repo) => repo.modelGetProfiles())
  ).pipe(Effect.andThen(Effect.forEach(decorateProfile)));

const updateProfileIfVersionMatches =
  (version: number, updates: ProfileUpdates) => (profile: ProfileWithPhoto) => {
    if (profile.version === version) {
      return ProfilesRepository.pipe(
        Effect.andThen((repo) =>
          repo.modelUpdateProfile(profile.profileId, {
            ...updates,
            version: version + 1,
          })
        )
      );
    } else {
      return Effect.fail(new ProfileVersionMismatch());
    }
  };

export const updateProfileByUserId =
  (userId: ModelUserId, version: number) => (updates: ProfileUpdates) =>
    getProfileByUserId(userId)
      .pipe(Effect.andThen(updateProfileIfVersionMatches(version, updates)))
      .pipe(Effect.andThen(decorateProfile));

export const setProfilePhoto = (
  userId: ModelUserId,
  mimeType: SupportedPhotoMimeType,
  content: Buffer
) =>
  getProfileByUserId(userId)
    .pipe(
      Effect.andThen((profile) =>
        addPhoto(mimeType, content, profile.displayName, profile.surname).pipe(
          Effect.andThen((photoId) =>
            ProfilesRepository.pipe(
              Effect.andThen((repo) =>
                repo.modelUpdateProfile(profile.profileId, {
                  photoIds: [photoId],
                  version: profile.version + 1,
                })
              )
            )
          )
        )
      )
    )
    .pipe(Effect.andThen(decorateProfile));
