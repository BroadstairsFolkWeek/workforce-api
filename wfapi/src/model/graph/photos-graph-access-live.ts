import { Config, Effect, Layer } from "effect";
import { GraphClient } from "../../graph/graph-client";
import {
  getDocumentLibraryListByTitle,
  updateGraphListItemFields,
} from "./common-graph-list-access";
import { graphRequestPutOrDie } from "./graph";
import { PhotosGraphAccess } from "./photos-graph-access";
import { DriveItemWithListItem } from "../interfaces/graph/graph-drive-items";
import {
  ModelEncodedAddablePhoto,
  ModelEncodedPhoto,
} from "../interfaces/photo";
import { Drive } from "@microsoft/microsoft-graph-types";
import { DocumentLibraryList } from "../interfaces/graph/graph-lists";

// Any config error is unrecoverable.
const photosListTitle = Config.string("WORKFORCE_PHOTOS_LIST_TITLE").pipe(
  Effect.orDie
);

const getPhotosList = () =>
  photosListTitle.pipe(
    Effect.andThen((title) => getDocumentLibraryListByTitle(title))
  );

const getPhotosDrive = () =>
  getPhotosList().pipe(Effect.andThen((list) => list.drive));

const uploadPhoto =
  (drive: Drive) => (filename: string, content: Buffer, mimeType: string) =>
    GraphClient.pipe(
      Effect.andThen((gc) => gc.client),
      Effect.andThen((client) =>
        client
          .api(`/drives/${drive.id}/root:/${filename}:/content`)
          .expand(["listItem"])
      ),
      Effect.andThen((gr) => graphRequestPutOrDie(gr)(content)),
      // No graph errors for uploading a file are expected to be recoverable.
      Effect.catchTag("GraphClientGraphError", (e) => Effect.die(e.graphError)),
      Effect.andThen((graphResponse) => graphResponse as DriveItemWithListItem)
    );

const updatePhotoListItem =
  (list: DocumentLibraryList) =>
  (id: string, fields: ModelEncodedAddablePhoto) =>
    updateGraphListItemFields(list.id!)<ModelEncodedPhoto>(id, fields);

export const photosGraphAccessLive = Layer.effect(
  PhotosGraphAccess,
  Effect.all([GraphClient, getPhotosList()]).pipe(
    Effect.andThen(([graphClient, photosList]) =>
      PhotosGraphAccess.of({
        uploadPhoto: (filename: string, content: Buffer) =>
          uploadPhoto(photosList.drive)(filename, content, "image/jpeg").pipe(
            Effect.provideService(GraphClient, graphClient)
          ),

        updatePhotoListItem: (id: string, fields: ModelEncodedAddablePhoto) =>
          updatePhotoListItem(photosList)(id, fields).pipe(
            Effect.provideService(GraphClient, graphClient)
          ),
      })
    )
  )
);
