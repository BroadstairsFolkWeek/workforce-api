import { Config, Effect, Layer } from "effect";
import { GraphClient } from "../../graph/graph-client";
import { getListItemsByFilter } from "./common-graph-list-access";
import { PhotosGraphAccess } from "./photos-graph-access";
import { ModelEncodedPersistedPhoto } from "../interfaces/photo";
import { getThumbnailsForDriveItem } from "./common-graph-drive-access";
import { DriveItem } from "@microsoft/microsoft-graph-types";

// Any config error is unrecoverable.
const photosListId = Config.string("WORKFORCE_PHOTOS_LIST_GUID").pipe(
  Effect.orDie
);

export const photosGraphAccessLive = Layer.effect(
  PhotosGraphAccess,
  Effect.all([photosListId, GraphClient]).pipe(
    Effect.map(([photosListId, graphClient]) =>
      PhotosGraphAccess.of({
        getPhotoGraphListItemsByFilter: (filter?: string) =>
          getListItemsByFilter(photosListId)<ModelEncodedPersistedPhoto>(
            filter,
            ["fields", "driveItem"]
          ).pipe(Effect.provideService(GraphClient, graphClient)),

        getThumbnailsForPhotoDriveItem: (driveItem: DriveItem) =>
          getThumbnailsForDriveItem(driveItem).pipe(
            Effect.provideService(GraphClient, graphClient)
          ),
      })
    )
  )
);
