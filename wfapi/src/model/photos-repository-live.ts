import { Config, Effect, Layer } from "effect";
import { PhotosRepository } from "./photos-repository";

export const photosRepositoryLive = Layer.effect(
  PhotosRepository,
  Config.string("WF_PHOTOS_SERVICE_BASE_URL").pipe(
    Effect.map((photosServiceBaseUrlString) => ({
      modelGetPhotoUrlForPhotoId: (photoId: string) =>
        Effect.succeed(
          new URL(`${photosServiceBaseUrlString}/photos/${photoId}`)
        ),
    }))
  )
);
