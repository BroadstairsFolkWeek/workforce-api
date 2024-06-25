import { Effect, Layer } from "effect";
import { PhotosRepository } from "../src/model/photos-repository";
import { ProfilesRepository } from "../src/model/profiles-repository";
import {
  ModelPersistedProfile,
  ModelProfileId,
} from "../src/model/interfaces/profile";
import { getProfileByUserId } from "../src/services/profiles";
import {
  ModelPersistedUserLogin,
  ModelUserId,
} from "../src/model/interfaces/user-login";
import { UserLoginRepository } from "../src/model/user-logins-repository";

const photoBaseUrl = new URL("http://photos.example.comp");
const testUserId = ModelUserId.make("userId");
const testProfileId = ModelProfileId.make("profileId");
const testPhotoId = "photoId";
const testOtherPhotoId = "otherPhotoId";

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

const testProfile: ModelPersistedProfile = {
  profileId: testProfileId,
  photoIds: [testPhotoId, testOtherPhotoId],
  displayName: "Test User",
  version: 1,
  dbId: 1,
  createdDate: new Date(),
  modifiedDate: new Date(),
};

const mockPhotosRepository = Layer.succeed(PhotosRepository, {
  modelGetPhotoUrlForPhotoId: (photoId: string) =>
    Effect.succeed(new URL(`/photos/${photoId}`, photoBaseUrl)),
});

const mockUserLoginssRepository = Layer.succeed(UserLoginRepository, {
  modelGetUserLoginByIdentityProviderUserId: (userId) =>
    Effect.succeed(testUserLogin),
  modelCreateUserLogin: () => Effect.die("Not implemented"),
});

const mockProfilesRepository = Layer.succeed(ProfilesRepository, {
  modelGetProfileByProfileId: () => Effect.succeed(testProfile),
  modelGetProfiles: () => Effect.succeed([testProfile]),
  modelCreateProfile: () => Effect.die("Not implemented"),
});

const mockLayers = Layer.mergeAll(
  mockPhotosRepository,
  mockProfilesRepository,
  mockUserLoginssRepository
);

test("Profiles service adds single photo URL to Profile when multiple photo Ids exist for profile", () => {
  const program = getProfileByUserId(ModelUserId.make("userId"));

  const runnable = Effect.provide(program, mockLayers);

  const actual = Effect.runSync(runnable);

  expect(actual.photoUrl).toBe(
    new URL(`/photos/${testPhotoId}`, photoBaseUrl).href
  );
});
