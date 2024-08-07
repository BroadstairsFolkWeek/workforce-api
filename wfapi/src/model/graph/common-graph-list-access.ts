import { Chunk, Effect, pipe } from "effect";
import { List } from "@microsoft/microsoft-graph-types";

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
} from "../interfaces/graph/graph-list-items";
import { DocumentLibraryList } from "../interfaces/graph/graph-lists";
import {
  Client,
  PageCollection,
  PageIterator,
  PageIteratorCallback,
} from "@microsoft/microsoft-graph-client";

// Consider any error whilst retrieving the siteId as an unexpected (and unrecoverable) error.
const siteIdEffect = getSiteId().pipe(Effect.orDie);

export const getListByTitle =
  (title: string) =>
  (expand: string[] = []) => {
    return siteIdEffect.pipe(
      Effect.andThen((siteId) =>
        GraphClient.pipe(
          Effect.andThen((gc) => gc.client),
          Effect.andThen((client) =>
            client.api(`/sites/${siteId}/lists/${title}`).expand(expand)
          ),
          Effect.andThen(graphRequestGetOrDie),
          // No graph errors for get requests against a list are expected to be recoverable.
          Effect.catchTag("GraphClientGraphError", (e) =>
            Effect.die(e.graphError)
          ),
          Effect.andThen((graphResponse) => graphResponse as List)
        )
      )
    );
  };

export const getDocumentLibraryListByTitle = (title: string) =>
  getListByTitle(title)(["drive"]).pipe(
    Effect.andThen((list) =>
      list.drive
        ? Effect.succeed(list as DocumentLibraryList)
        : Effect.die("Expected drive to be defined")
    )
  );

const collectGraphListItemPages =
  (client: Client) =>
  <T extends PersistedGraphListItemFields>(pageCollection: PageCollection) => {
    let collection = Chunk.empty<PersistedGraphListItem<T>>();

    const callback: PageIteratorCallback = (
      item: PersistedGraphListItem<T>
    ) => {
      collection = Chunk.append(collection, item);
      return true;
    };

    const pageIterator = new PageIterator(client, pageCollection, callback);

    return Effect.tryPromise({
      try: async () => {
        await pageIterator.iterate();
        return Chunk.toReadonlyArray(collection);
      },
      catch: (e) => Error("" + e),
    }).pipe(Effect.catchAll((e) => Effect.die(e)));
  };

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
            pipe(
              Effect.succeed(
                client
                  .api(`/sites/${siteId}/lists/${listId}/items`)
                  .expand(expand)
              ),
              Effect.andThen((gr) => (filter ? gr.filter(filter) : gr)),
              Effect.andThen(graphRequestGetOrDie),
              Effect.andThen((response) => response as PageCollection),
              Effect.andThen((pageCollection) =>
                collectGraphListItemPages(client)<RetT>(pageCollection)
              )
            )
          ),
          // No graph errors for get requests against a list are expected to be recoverable.
          Effect.catchTag("GraphClientGraphError", (e) =>
            Effect.die(e.graphError)
          )
        )
      )
    );
  };

export const updateGraphListItemFields =
  (listId: string) =>
  <RetT extends PersistedGraphListItemFields>(
    id: number | string,
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
