import { Effect, Context } from "effect";
import { PersistedGraphListItem } from "../interfaces/graph/graph-items";
import { ModelEncodedPersistedPhoto } from "../interfaces/photo";
import { DriveItem, ThumbnailSet } from "@microsoft/microsoft-graph-types";

export class PhotosGraphAccess extends Context.Tag("PhotosGraphAccess")<
  PhotosGraphAccess,
  {
    readonly getPhotoGraphListItemsByFilter: (
      filter?: string
    ) => Effect.Effect<PersistedGraphListItem<ModelEncodedPersistedPhoto>[]>;

    readonly getThumbnailsForPhotoDriveItem: (
      driveItem: DriveItem
    ) => Effect.Effect<ThumbnailSet[]>;
  }
>() {}
