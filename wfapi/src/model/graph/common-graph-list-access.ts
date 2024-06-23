import { Effect } from "effect";
import {
  graphRequestDeleteOrDie,
  graphRequestGetOrDie,
  graphRequestPatchOrDie,
  graphRequestPostOrDie,
} from "./graph";
import { GraphClient } from "../../graph/graph-client";
import { getSiteId } from "./site-graph";
import {
  AddableGraphListItemFields,
  PersistedGraphListItem,
  PersistedGraphListItemFields,
  UpdatableGraphListItemFields,
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

export const updateGraphListItemFields =
  (listId: string) =>
  <RetT extends PersistedGraphListItemFields>(
    id: number,
    changes: UpdatableGraphListItemFields
  ) => {
    return siteIdEffect.pipe(
      Effect.andThen((siteId) =>
        GraphClient.pipe(
          Effect.andThen((gc) => gc.client),
          Effect.andThen((client) =>
            client.api(`/sites/${siteId}/lists/${listId}/items/${id}/fields`)
          ),
          Effect.andThen((gr) => graphRequestPatchOrDie(gr)(changes)),
          // No graph errors for patch requests against a list are expected to be recoverable.
          Effect.catchTag("GraphClientGraphError", (e) =>
            Effect.die(e.graphError)
          ),
          Effect.andThen((graphResponse) => graphResponse as RetT)
        )
      )
    );
  };

export const createGraphListItem =
  (listId: string) =>
  <Addable extends AddableGraphListItemFields>(
    fields: Addable
  ): Effect.Effect<
    PersistedGraphListItem<Addable & PersistedGraphListItemFields>,
    never,
    GraphClient
  > => {
    return siteIdEffect.pipe(
      Effect.andThen((siteId) =>
        GraphClient.pipe(
          Effect.andThen((gc) => gc.client),
          Effect.andThen((client) =>
            client.api(`/sites/${siteId}/lists/${listId}/items`)
          ),
          Effect.andThen((gr) => graphRequestPostOrDie(gr)({ fields })),
          // No graph errors for post requests against a list are expected to be recoverable.
          Effect.catchTag("GraphClientGraphError", (e) =>
            Effect.die(e.graphError)
          )
        )
      )
    );
  };

export const deleteGraphListItem = (listId: string) => (id: number) => {
  return siteIdEffect.pipe(
    Effect.andThen((siteId) =>
      GraphClient.pipe(
        Effect.andThen((gc) => gc.client),
        Effect.andThen((client) =>
          client.api(`/sites/${siteId}/lists/${listId}/items/${id}`)
        ),
        Effect.andThen((gr) => graphRequestDeleteOrDie(gr)),
        // No graph errors for get requests against a list are expected to be recoverable.
        Effect.catchTag("GraphClientGraphError", (e) =>
          Effect.die(e.graphError)
        )
      )
    )
  );
};
