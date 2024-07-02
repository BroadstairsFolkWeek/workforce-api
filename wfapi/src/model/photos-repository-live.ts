import { Config, Effect, Layer } from "effect";
import { Schema } from "@effect/schema";
import { PhotosRepository } from "./photos-repository";
import {
  ModelAddablePhoto,
  ModelPhoto,
  ModelPhotoId,
  ModelPhotoUrls,
} from "./interfaces/photo";
import { PhotosGraphAccess } from "./graph/photos-graph-access";

const getEncodedPhotoFields = (
  photoId: ModelPhotoId,
  name: string,
  givenName?: string,
  surname?: string
) => {
  const photo: ModelAddablePhoto = {
    photoId: photoId,
    title: name,
    givenName,
    surname,
  };

  return Schema.encode(ModelAddablePhoto)(photo);
};

const decodePhoto = (fields: any) => Schema.decodeUnknown(ModelPhoto)(fields);

const addPhoto = (
  content: Buffer,
  photoId: ModelPhotoId,
  name: string,
  givenName?: string,
  surname?: string
) =>
  PhotosGraphAccess.pipe(
    Effect.andThen((photosGraphAccess) =>
      photosGraphAccess.uploadPhoto(name, content).pipe(
        Effect.andThen((driveItem) => driveItem.listItem),
        Effect.andThen((listItem) =>
          getEncodedPhotoFields(photoId, name, givenName, surname).pipe(
            Effect.andThen((encodedFields) =>
              photosGraphAccess.updatePhotoListItem(listItem.id!, encodedFields)
            ),
            Effect.andThen(decodePhoto),
            Effect.andThen((photo) => photoId)
          )
        )
      )
    ),
    Effect.catchTag("ParseError", () => Effect.die("Failed to parse photo."))
  );

const getPhotoUrlsForPhotoId =
  (photosServiceBaseUrlString: string) =>
  (photoId: string): ModelPhotoUrls => ({
    photoUrl: new URL(`${photosServiceBaseUrlString}/photos/${photoId}`),
    photoThumbnailUrl: new URL(
      `${photosServiceBaseUrlString}/photos/${photoId}/thumbnail`
    ),
  });

export const photosRepositoryLive = Layer.effect(
  PhotosRepository,
  Effect.all([
    Config.string("WF_PHOTOS_SERVICE_BASE_URL"),
    PhotosGraphAccess,
  ]).pipe(
    Effect.map(([photosServiceBaseUrlString, photosGraphAccess]) => ({
      modelGetPhotoUrlsForPhotoId: getPhotoUrlsForPhotoId(
        photosServiceBaseUrlString
      ),

      modelAddPhoto: (
        content: Buffer,
        photoId: ModelPhotoId,
        name: string,
        givenName?: string,
        surname?: string
      ) =>
        addPhoto(content, photoId, name, givenName, surname).pipe(
          Effect.provideService(PhotosGraphAccess, photosGraphAccess)
        ),
    }))
  )
);
