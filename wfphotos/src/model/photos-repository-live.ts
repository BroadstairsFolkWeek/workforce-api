import { Effect, Layer } from "effect";
import { Schema } from "@effect/schema";
import { PhotoNotFound, PhotosRepository } from "./photos-repository";
import { PhotosGraphAccess } from "./graph/photos-graph-access";
import { ModelPersistedPhoto } from "./interfaces/photo";
import { FetchApi } from "../fetch/fetch-api";
import { DriveItem } from "@microsoft/microsoft-graph-types";

const PhotoListItem = Schema.Struct({
  fields: ModelPersistedPhoto,
  driveItem: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    parentReference: Schema.Struct({
      driveId: Schema.String,
    }),
    "@microsoft.graph.downloadUrl": Schema.String,
    file: Schema.Struct({
      mimeType: Schema.String,
    }),
  }),
});

interface PhotoListItem extends Schema.Schema.Type<typeof PhotoListItem> {}

const PhotoListItems = Schema.Array(PhotoListItem);

const getPhotoListItemsByFilter = (filter: string) =>
  PhotosGraphAccess.pipe(
    Effect.andThen((listAccess) =>
      listAccess.getPhotoGraphListItemsByFilter(filter)
    ),
    Effect.andThen(Schema.decodeUnknown(PhotoListItems)),
    // Parse errors of data from Graph/SharePoint are considered unrecoverable.
    Effect.catchTag("ParseError", (e) => Effect.die(e))
  );

const getFirstPhotoListItemByFilter = (filter: string) =>
  getPhotoListItemsByFilter(filter).pipe(
    Effect.head,
    Effect.catchTag("NoSuchElementException", () =>
      Effect.fail(new PhotoNotFound())
    )
  );

const getPhotoContentForPhotoListItem = (item: PhotoListItem) =>
  FetchApi.pipe(
    Effect.andThen((fetchApi) =>
      fetchApi.fetchGet(item.driveItem["@microsoft.graph.downloadUrl"])
    ),
    Effect.andThen((content) => ({
      mimeType: item.driveItem.file.mimeType,
      content,
    }))
  );

const getThumbnailUrlForDriveItem = (driveItem: DriveItem) =>
  PhotosGraphAccess.pipe(
    Effect.andThen((photosGraphAccess) =>
      photosGraphAccess.getThumbnailsForPhotoDriveItem(driveItem)
    ),
    Effect.head,
    Effect.andThen((x) => Effect.fromNullable(x.medium?.url))
  );

const getThumbnailContentForPhotoListItem = (item: PhotoListItem) =>
  getThumbnailUrlForDriveItem(item.driveItem).pipe(
    Effect.andThen((thumbnailUrl) =>
      FetchApi.pipe(
        Effect.andThen((fetchApi) => fetchApi.fetchGet(thumbnailUrl)),
        Effect.andThen((content) => ({
          mimeType: item.driveItem.file.mimeType,
          content,
        }))
      )
    ),
    Effect.catchTag("NoSuchElementException", () =>
      getPhotoContentForPhotoListItem(item)
    )
  );

const getFirstPhotoContentByFilter = (filter: string) =>
  getFirstPhotoListItemByFilter(filter).pipe(
    Effect.andThen(getPhotoContentForPhotoListItem),
    // HTTP errors are considered unrecoverable.
    Effect.catchTag("RequestError", (e) => Effect.die(e)),
    Effect.catchTag("ResponseError", (e) => Effect.die(e))
  );

const getFirstPhotoThumbnailContentByFilter = (filter: string) =>
  getFirstPhotoListItemByFilter(filter).pipe(
    Effect.andThen(getThumbnailContentForPhotoListItem),
    // HTTP errors are considered unrecoverable.
    Effect.catchTag("RequestError", (e) => Effect.die(e)),
    Effect.catchTag("ResponseError", (e) => Effect.die(e))
  );

const getPhotoContentByPhotoId = (photoId: string) =>
  getFirstPhotoContentByFilter(`fields/PhotoId eq '${photoId}'`);

const getPhotoThumbnailContentByPhotoId = (photoId: string) =>
  getFirstPhotoThumbnailContentByFilter(`fields/PhotoId eq '${photoId}'`);

export const photosRepositoryLive = Layer.effect(
  PhotosRepository,
  Effect.all([PhotosGraphAccess, FetchApi]).pipe(
    Effect.map(([service, fetchApi]) => ({
      modelGetPhotoByPhotoId: (photoId: string) =>
        getPhotoContentByPhotoId(photoId).pipe(
          Effect.provideService(PhotosGraphAccess, service),
          Effect.provideService(FetchApi, fetchApi)
        ),

      modelGetPhotoThumbnailByPhotoId: (photoId: string) =>
        getPhotoThumbnailContentByPhotoId(photoId).pipe(
          Effect.provideService(PhotosGraphAccess, service),
          Effect.provideService(FetchApi, fetchApi)
        ),
    }))
  )
);
