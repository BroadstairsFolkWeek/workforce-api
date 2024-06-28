import { Effect, Context } from "effect";
import { DriveItemWithListItem } from "../interfaces/graph/graph-drive-items";
import {
  ModelEncodedAddablePhoto,
  ModelEncodedPhoto,
} from "../interfaces/photo";

export class PhotosGraphAccess extends Context.Tag("PhotosGraphAccess")<
  PhotosGraphAccess,
  {
    readonly uploadPhoto: (
      filename: string,
      content: Buffer
    ) => Effect.Effect<DriveItemWithListItem>;

    readonly updatePhotoListItem: (
      id: string,
      fields: ModelEncodedAddablePhoto
    ) => Effect.Effect<ModelEncodedPhoto>;
  }
>() {}
