import { Config, Effect, Layer } from "effect";
import { PhotosRepository } from "../src/model/photos-repository";
import { photosRepositoryLive } from "../src/model/photos-repository-live";
import { photosGraphAccessLive } from "../src/model/graph/photos-graph-access-live";
import { defaultGraphClient } from "../src/graph/default-graph-client";
import { fetchApiLive } from "../src/fetch/fetch-api-live";

test("get photo by Photo ID", async () => {
  const program = Effect.all([
    Config.string("TEST_PHOTO_ID"),
    PhotosRepository,
  ]).pipe(
    Effect.andThen(([photoId, repository]) =>
      repository.modelGetPhotoByPhotoId(photoId)
    )
  );

  const layers = photosRepositoryLive.pipe(
    Layer.provide(photosGraphAccessLive),
    Layer.provide(defaultGraphClient),
    Layer.provide(fetchApiLive)
  );

  const runnable = Effect.provide(program, layers);

  const result = await Effect.runPromise(runnable);

  expect(result.mimeType).toBe("image/jpeg");
  expect(result.content.byteLength).toBeGreaterThan(0);
});
