import { Effect } from "effect";
import { PhotosRepository } from "../model/photos-repository";

export const getPhotoByPhotoId = (photoId: string) =>
  PhotosRepository.pipe(
    Effect.andThen((repo) => repo.modelGetPhotoByPhotoId(photoId))
  );

export const getPhotoThumbnailByPhotoId = (photoId: string) =>
  PhotosRepository.pipe(
    Effect.andThen((repo) => repo.modelGetPhotoByPhotoId(photoId))
  );
