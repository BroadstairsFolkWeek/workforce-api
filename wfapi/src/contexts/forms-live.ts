import { Layer } from "effect";
import { formProviderLive } from "../forms/providers/form-provider-live";
import { applicationsRepositoryLive } from "../model/applications-repository-live";
import { applicationsGraphListAccessLive } from "../model/graph/applications-graph-list-access-live";
import { defaultGraphClient } from "../graph/default-graph-client";
import { wfApplicationFormProviderLive } from "../forms/providers/wf-application-forms/wf-application-form-provider-repo";

export const formsLayerLive = formProviderLive.pipe(
  Layer.provide(wfApplicationFormProviderLive),
  Layer.provide(applicationsRepositoryLive),
  Layer.provide(applicationsGraphListAccessLive),
  Layer.provide(defaultGraphClient)
);
