import { Layer } from "effect";
import { wfApplicationsFormProviderLive } from "../forms/providers/wf-application-forms/wf-application-form-provider-repo";
import { formsAccessLive } from "../forms/access/forms-access-live";
import { applicationsRepositoryLive } from "../model/applications-repository-live";
import { applicationsGraphListAccessLive } from "../model/graph/applications-graph-list-access-live";
import { defaultGraphClient } from "../graph/default-graph-client";

export const formsLayerLive = formsAccessLive.pipe(
  Layer.provide(wfApplicationsFormProviderLive),
  Layer.provide(applicationsRepositoryLive),
  Layer.provide(applicationsGraphListAccessLive),
  Layer.provide(defaultGraphClient)
);
