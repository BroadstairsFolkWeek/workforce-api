import { Effect } from "effect";
import { PhotosRepository } from "../model/photos-repository";

export const getPhotoUrlForPhotoId = (photoId: string) =>
  PhotosRepository.pipe(
    Effect.andThen((repo) => repo.modelGetPhotoUrlForPhotoId(photoId))
  );
