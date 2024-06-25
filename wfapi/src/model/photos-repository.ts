import { Effect, Context } from "effect";
import { URL } from "url";

export class PhotosRepository extends Context.Tag("PhotosRepository")<
  PhotosRepository,
  {
    readonly modelGetPhotoUrlForPhotoId: (
      photoId: string
    ) => Effect.Effect<URL>;
  }
>() {}
