import { Effect } from "effect";
import { PhotosRepository } from "../model/photos-repository";
import { v4 as uuidv4 } from "uuid";
import { ModelPhotoId } from "../model/interfaces/photo";

export type SupportedPhotoMimeType = "image/jpeg" | "image/png";

export const getPhotoUrlsForPhotoId = (photoId: string) =>
  PhotosRepository.pipe(
    Effect.andThen((repo) => repo.modelGetPhotoUrlsForPhotoId(photoId))
  );

const getExtensionForMimeType = (mimeType: SupportedPhotoMimeType) => {
  if (mimeType === "image/jpeg") {
    return "jpg";
  } else if (mimeType === "image/png") {
    return "png";
  }
};

export const addPhoto = (
  mimeType: SupportedPhotoMimeType,
  content: Buffer,
  basename: string,
  givenName?: string,
  surname?: string
) => {
  const photoId = ModelPhotoId.make(uuidv4());
  const extension = getExtensionForMimeType(mimeType);
  const filename = `${basename} - ${photoId}.${extension}`;

  return PhotosRepository.pipe(
    Effect.andThen((repo) =>
      repo.modelAddPhoto(content, photoId, filename, givenName, surname)
    )
  );
};
