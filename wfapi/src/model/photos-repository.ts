import { Effect, Context } from "effect";
import { ModelPhotoId, ModelPhotoUrls } from "./interfaces/photo";

export class PhotosRepository extends Context.Tag("PhotosRepository")<
  PhotosRepository,
  {
    readonly modelGetPhotoUrlsForPhotoId: (photoId: string) => ModelPhotoUrls;

    readonly modelAddPhoto: (
      content: Buffer,
      photoId: ModelPhotoId,
      name: string,
      givenName?: string,
      surname?: string
    ) => Effect.Effect<ModelPhotoId>;
  }
>() {}
