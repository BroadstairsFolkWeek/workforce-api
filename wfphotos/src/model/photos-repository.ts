import { Effect, Context } from "effect";

export class PhotoNotFound {
  readonly _tag = "PhotoNotFound";
}

export interface PhotoContent {
  mimeType: string;
  content: ArrayBuffer;
}

export class PhotosRepository extends Context.Tag("PhotosRepository")<
  PhotosRepository,
  {
    readonly modelGetPhotoByPhotoId: (
      profileId: string
    ) => Effect.Effect<PhotoContent, PhotoNotFound>;

    readonly modelGetPhotoThumbnailByPhotoId: (
      profileId: string
    ) => Effect.Effect<PhotoContent, PhotoNotFound>;
  }
>() {}
