import { DriveItem, ThumbnailSet } from "@microsoft/microsoft-graph-types";
import { GraphClient } from "../../graph/graph-client";
import { Effect } from "effect";
import { graphRequestGetOrDie } from "./graph";

export const getThumbnailsForDriveItem = (driveItem: DriveItem) =>
  GraphClient.pipe(
    Effect.andThen((gc) => gc.client),
    Effect.andThen((client) =>
      client.api(
        `/drives/${driveItem.parentReference?.driveId}/items/${driveItem.id}/thumbnails`
      )
    ),
    Effect.andThen(graphRequestGetOrDie),
    // No graph errors for get requests against a list are expected to be recoverable.
    Effect.catchTag("GraphClientGraphError", (e) => Effect.die(e.graphError)),
    Effect.andThen((graphResponse) => graphResponse.value as ThumbnailSet[])
  );
