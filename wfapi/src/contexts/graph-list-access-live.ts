import { Layer } from "effect";
import { userLoginsGraphListAccessLive } from "../model/graph/user-logins-graph-list-access-live";
import { profilesGraphListAccessLive } from "../model/graph/profiles-graph-list-access-live";

export const graphListAccessesLive = Layer.mergeAll(
  userLoginsGraphListAccessLive,
  profilesGraphListAccessLive
);
