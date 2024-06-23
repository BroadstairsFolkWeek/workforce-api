import { Effect } from "effect";
import { graphRequestGetOrDie } from "./graph";
import { GraphClient } from "../../graph/graph-client";
import { getSiteId } from "./site-graph";
import {
  PersistedGraphListItem,
  PersistedGraphListItemFields,
} from "../interfaces/graph/graph-items";

// Consider any error whilst retrieving the siteId as an unexpected (and unrecoverable) error.
const siteIdEffect = getSiteId().pipe(Effect.orDie);

export const getListItemsByFilter =
  (listId: string) =>
  <RetT extends PersistedGraphListItemFields>(
    filter?: string,
    expand: string[] = ["fields"]
  ) => {
    return siteIdEffect.pipe(
      Effect.andThen((siteId) =>
        GraphClient.pipe(
          Effect.andThen((gc) => gc.client),
          Effect.andThen((client) =>
            client.api(`/sites/${siteId}/lists/${listId}/items`).expand(expand)
          ),
          Effect.andThen((gr) => (filter ? gr.filter(filter) : gr)),
          Effect.andThen(graphRequestGetOrDie),
          // No graph errors for get requests against a list are expected to be recoverable.
          Effect.catchTag("GraphClientGraphError", (e) =>
            Effect.die(e.graphError)
          ),
          Effect.andThen(
            (graphResponse) =>
              graphResponse.value as PersistedGraphListItem<RetT>[]
          )
        )
      )
    );
  };
