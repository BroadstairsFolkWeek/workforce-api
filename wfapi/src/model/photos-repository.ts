import { Effect, Context } from "effect";
import { URL } from "url";
import { ModelPhotoId } from "./interfaces/photo";

export class PhotosRepository extends Context.Tag("PhotosRepository")<
  PhotosRepository,
  {
    readonly modelGetPhotoUrlForPhotoId: (
      photoId: string
    ) => Effect.Effect<URL>;

    readonly modelAddPhoto: (
      content: Buffer,
      photoId: ModelPhotoId,
      name: string,
      givenName?: string,
      surname?: string
    ) => Effect.Effect<ModelPhotoId>;
  }
>() {}
