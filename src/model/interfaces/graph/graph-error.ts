import { GraphError } from "@microsoft/microsoft-graph-client";

export class GraphClientGraphError {
  readonly _tag = "GraphClientGraphError";
  readonly graphError: GraphError;

  constructor(error: GraphError) {
    this.graphError = error;
  }
}

export function wrapIfGraphError(error: unknown) {
  return error instanceof GraphError
    ? new GraphClientGraphError(error)
    : new Error("" + error);
}
