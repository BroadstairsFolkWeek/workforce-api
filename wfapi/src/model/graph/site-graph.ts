import { Config, Effect, pipe } from "effect";

import { Site } from "@microsoft/microsoft-graph-types";
import { getGraphClient, graphRequestGetOrDie } from "./graph";

class SpSiteNotFoundError extends Error {
  constructor(siteHostname: string, sitePath: string) {
    super(`Site not found: ${siteHostname}:${sitePath}`);
  }
}

const getSite = () =>
  getGraphClient()
    .pipe(
      Effect.flatMap((client) =>
        Effect.all([
          Config.string("WORKFORCE_SITE_HOSTNAME"),
          Config.string("WORKFORCE_SITE_PATH"),
        ])
          .pipe(Effect.orDie)
          .pipe(
            Effect.flatMap(([siteHostname, sitePath]) =>
              pipe(
                client.api(`/sites/${siteHostname}:/${sitePath}`),
                graphRequestGetOrDie,
                Effect.catchTag("GraphClientGraphError", (e) =>
                  e.graphError.statusCode === 404
                    ? Effect.fail(
                        new SpSiteNotFoundError(siteHostname, sitePath)
                      )
                    : Effect.die(e.graphError)
                )
              )
            )
          )
      )
    )
    .pipe(Effect.map((site) => site as Site));

export const getSiteId = () =>
  getSite().pipe(
    Effect.map((site) => site.id),
    Effect.flatMap((id) =>
      id ? Effect.succeed(id) : Effect.die(new Error("Site ID not found"))
    )
  );

export const getClientAndSiteId = () =>
  getGraphClient().pipe(
    Effect.flatMap((gc) =>
      getSiteId().pipe(Effect.map((siteId) => [gc, siteId] as const))
    )
  );
