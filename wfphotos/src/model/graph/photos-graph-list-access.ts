import { Effect, Context } from "effect";
import { PersistedGraphListItem } from "../interfaces/graph/graph-items";
import { ModelEncodedPersistedPhoto } from "../interfaces/photo";

export class PhotosGraphListAccess extends Context.Tag("PhotosGraphListAccess")<
  PhotosGraphListAccess,
  {
    readonly getPhotoGraphListItemsByFilter: (
      filter?: string
    ) => Effect.Effect<PersistedGraphListItem<ModelEncodedPersistedPhoto>[]>;
  }
>() {}
