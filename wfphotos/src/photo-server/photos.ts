import { Hono } from "hono";
import { Effect } from "effect";
import { getPhotoByPhotoId } from "../services/photo";
import { layersLive } from "../contexts/layers-live";

const photos = new Hono();

photos.get("/:photoId", async (c) => {
  const { photoId } = c.req.param();

  const getPhotoEffect = getPhotoByPhotoId(photoId)
    .pipe(
      Effect.andThen((photoContent) =>
        c.body(photoContent.content, 200, {
          "Content-Type": photoContent.mimeType,
          "Cache-Control": "public, max-age=604800",
        })
      )
    )
    .pipe(
      Effect.catchTag("PhotoNotFound", () => Effect.succeed(c.json({}, 404)))
    );

  return await Effect.runPromise(
    getPhotoEffect.pipe(Effect.provide(layersLive))
  );
});

export default photos;
