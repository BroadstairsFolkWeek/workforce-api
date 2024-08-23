import { Array, Effect, HashMap, Option } from "effect";
import { v4 as uuidv4 } from "uuid";

import { getUser } from "./users";
import {
  ProfileNotFound,
  ProfilesRepository,
} from "../model/profiles-repository";
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
import { initialiseAddableProfile } from "./profile";
import { Profile, ProfileId } from "../interfaces/profile";
import { UserId } from "../interfaces/user";

export class ProfileVersionMismatch {
  readonly _tag = "ProfileVersionMismatch";
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

const profileInformationMissing = (userProfile: ModelPersistedProfile) => {
  return (
    !userProfile.displayName ||
    !userProfile.givenName ||
    !userProfile.surname ||
    !userProfile.address ||
    !userProfile.telephone
  );
};

const getProfileByUserId = (userId: UserId) =>
  getUser(userId).pipe(Effect.andThen((userLogin) => userLogin.profile));

const getProfilePhotoId = (profile: ModelPersistedProfile) =>
  Array.head(profile.photoIds ?? []).pipe(
    Option.andThen(photoIdFromEncodedPhotoId)
  );

const getPhotoUrls = (profile: ModelPersistedProfile) =>
  getProfilePhotoId(profile).pipe(Effect.andThen(getPhotoUrlsForPhotoId));

const modelProfileToProfile = (
  modelProfile: ModelPersistedProfile
): Effect.Effect<Profile, never, PhotosRepository> =>
  getProfilePhotoId(modelProfile)
    .pipe(Effect.option)
    .pipe(
      Effect.andThen((photoId) =>
        getPhotoUrls(modelProfile)
          .pipe(
            Effect.andThen((photoUrls) => ({
              photoUrlHref: photoUrls.photoUrl.href,
              photoThumbnailUrlHref: photoUrls.photoThumbnailUrl.href,
            })),
            Effect.option
          )
          .pipe(
            Effect.andThen((hrefs) =>
              Effect.succeed({
                id: modelProfile.profileId,
                displayName: modelProfile.displayName,
                email: modelProfile.email,
                givenName: modelProfile.givenName,
                surname: modelProfile.surname,
                address: modelProfile.address,
                telephone: modelProfile.telephone,
                metadata: {
                  version: modelProfile.version,
                  photoId: Option.getOrUndefined(photoId),
                  photoUrl: hrefs.pipe(
                    Option.map((hrefs) => hrefs.photoUrlHref),
                    Option.getOrUndefined
                  ),
                  photoThumbnailUrl: hrefs.pipe(
                    Option.map((hrefs) => hrefs.photoThumbnailUrlHref),
                    Option.getOrUndefined
                  ),
                  photoRequired: Option.isNone(hrefs),
                  profileInformationRequired:
                    profileInformationMissing(modelProfile),
                },
              })
            )
          )
      )
    );

export const getProfileByProfileId = (
  profileId: ProfileId
): Effect.Effect<
  Profile,
  ProfileNotFound,
  ProfilesRepository | PhotosRepository
> =>
  ProfilesRepository.pipe(
    Effect.andThen((repo) => repo.modelGetProfileByProfileId(profileId)),
    Effect.andThen(modelProfileToProfile)
  );

export const getProfiles = (): Effect.Effect<
  Profile[],
  never,
  PhotosRepository | ProfilesRepository
> =>
  ProfilesRepository.pipe(
    Effect.andThen((repo) => repo.modelGetProfiles())
  ).pipe(Effect.andThen(Effect.forEach(modelProfileToProfile)));

export const getProfilesHashMapByProfileIds = (profileIds: Set<ProfileId>) =>
  getProfiles()
    .pipe(
      Effect.andThen(Array.filter((profile) => profileIds.has(profile.id))),
      Effect.andThen(Array.map((profile) => [profile.id, profile] as const)),
      Effect.andThen(HashMap.fromIterable)
    )
    .pipe(
      // Check for any missing profile ids.
      Effect.tap((foundProfiles) =>
        Array.findFirst(
          profileIds,
          (profileId) => !HashMap.has(profileId)(foundProfiles)
        ).pipe(
          Effect.andThen((missingProfileId) =>
            Effect.fail(new ProfileNotFound({ profileId: missingProfileId }))
          ),
          Effect.catchTag("NoSuchElementException", () => Effect.succeedNone)
        )
      )
    );

export const createProfile = (displayName: string, email: string) =>
  ProfilesRepository.pipe(
    Effect.andThen((repo) =>
      repo.modelCreateProfile(
        initialiseAddableProfile(
          ModelProfileId.make(uuidv4()),
          displayName,
          email
        )
      )
    )
  ).pipe(Effect.andThen(modelProfileToProfile));

const updateProfileIfVersionMatches =
  (version: number, updates: ProfileUpdates) => (profile: Profile) => {
    if (profile.metadata.version === version) {
      return ProfilesRepository.pipe(
        Effect.andThen((repo) =>
          repo.modelUpdateProfile(profile.id, {
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
  (userId: UserId, version: number) => (updates: ProfileUpdates) =>
    getProfileByUserId(userId).pipe(
      Effect.andThen(updateProfileIfVersionMatches(version, updates)),
      Effect.andThen(modelProfileToProfile)
    );

export const setProfilePhoto = (
  userId: UserId,
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
                repo.modelUpdateProfile(profile.id, {
                  photoIds: [photoId],
                  version: profile.metadata.version + 1,
                })
              )
            )
          )
        )
      )
    )
    .pipe(Effect.andThen(modelProfileToProfile));

export const deleteProfileByUserId = (userId: ProfileId) =>
  getProfileByProfileId(userId).pipe(
    Effect.andThen((profile) =>
      ProfilesRepository.pipe(
        Effect.andThen((repo) => repo.modelDeleteProfileByProfileId(profile.id))
      )
    )
  );
