import { Effect, Layer } from "effect";
import { PhotosRepository } from "../src/model/photos-repository";
import { ProfilesRepository } from "../src/model/profiles-repository";
import {
  ModelPersistedProfile,
  ModelProfileId,
} from "../src/model/interfaces/profile";
import { getProfileByUserId, setProfilePhoto } from "../src/services/profiles";
import {
  ModelPersistedUserLogin,
  ModelUserId,
} from "../src/model/interfaces/user-login";
import { UserLoginRepository } from "../src/model/user-logins-repository";
import { ModelPhotoId } from "../src/model/interfaces/photo";

const photoBaseUrl = new URL("http://photos.example.comp");
const testUserId = ModelUserId.make("userId");
const testProfileId = ModelProfileId.make("profileId");
const testProfileVersion = 1;
const addedPhotoId = ModelPhotoId.make("addedPhotoId");

const testUserLogin: ModelPersistedUserLogin = {
  identityProviderUserId: testUserId,
  profileId: testProfileId,
  displayName: "Test User",
  identityProvider: "test",
  identityProviderUserDetails: "",
  dbId: 1,
  createdDate: new Date(),
  modifiedDate: new Date(),
};

const mockPhotosRepository = Layer.succeed(PhotosRepository, {
  modelGetPhotoUrlForPhotoId: (photoId: string) =>
    Effect.succeed(new URL(`/photos/${photoId}`, photoBaseUrl)),
  modelAddPhoto: () => Effect.succeed(addedPhotoId),
});

const createTestProfile = (photoIds: string[]): ModelPersistedProfile => ({
  profileId: testProfileId,
  photoIds,
  displayName: "Test User",
  version: testProfileVersion,
  dbId: 1,
  createdDate: new Date(),
  modifiedDate: new Date(),
});

const createMockProfilesRepository = (profile: ModelPersistedProfile) =>
  Layer.succeed(ProfilesRepository, {
    modelGetProfileByProfileId: () => Effect.succeed(profile),
    modelGetProfiles: () => Effect.succeed([profile]),
    modelCreateProfile: () => Effect.die("Not implemented"),
    modelUpdateProfile: (profileId, updates) =>
      Effect.succeed({
        ...profile,
        ...updates,
        profileId,
      }),
  });

const mockUserLoginssRepository = Layer.succeed(UserLoginRepository, {
  modelGetUserLoginByIdentityProviderUserId: (userId) =>
    Effect.succeed(testUserLogin),
  modelCreateUserLogin: () => Effect.die("Not implemented"),
});

test("Profiles service adds single photo URL to Profile when multiple photo Ids exist for profile", () => {
  const testPhotoId = "photoId";
  const testOtherPhotoId = "otherPhotoId";

  const profile = createTestProfile([testPhotoId, testOtherPhotoId]);

  const mockProfilesRepository = createMockProfilesRepository(profile);

  const mockLayers = Layer.mergeAll(
    mockPhotosRepository,
    mockProfilesRepository,
    mockUserLoginssRepository
  );

  const program = getProfileByUserId(ModelUserId.make("userId"));

  const runnable = Effect.provide(program, mockLayers);

  const actual = Effect.runSync(runnable);

  expect(actual.photoUrl).toBe(
    new URL(`/photos/${testPhotoId}`, photoBaseUrl).href
  );
});

test("Profiles services extracts photo ID from combined photo ID for use in photo URL", () => {
  const testPhotoId = "photoId";
  const testCombinedPhotoId = `combined:${testPhotoId}`;
  const testOtherPhotoId = "otherPhotoId";

  const profile = createTestProfile([testCombinedPhotoId, testOtherPhotoId]);

  const mockProfilesRepository = createMockProfilesRepository(profile);

  const mockLayers = Layer.mergeAll(
    mockPhotosRepository,
    mockProfilesRepository,
    mockUserLoginssRepository
  );

  const program = getProfileByUserId(ModelUserId.make("userId"));

  const runnable = Effect.provide(program, mockLayers);

  const actual = Effect.runSync(runnable);

  expect(actual.photoUrl).toBe(
    new URL(`/photos/${testPhotoId}`, photoBaseUrl).href
  );
});

test("Adding a new profile photo causes the photo ID to be applied to the profile", () => {
  const prevPhotoId = "prevPhotoId";
  const initialProfile = createTestProfile([prevPhotoId]);

  const mockProfilesRepository = createMockProfilesRepository(initialProfile);

  const mockLayers = Layer.mergeAll(
    mockPhotosRepository,
    mockProfilesRepository,
    mockUserLoginssRepository
  );

  const photoBuffer = Buffer.from("test photo");

  const program = setProfilePhoto(testUserId, "image/png", photoBuffer);

  const runnable = Effect.provide(program, mockLayers);

  const updatedProfile = Effect.runSync(runnable);

  expect(updatedProfile.photoIds).toEqual([addedPhotoId]);
  expect(updatedProfile.version).toEqual(testProfileVersion + 1);
});
