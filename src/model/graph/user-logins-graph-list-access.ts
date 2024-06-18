import { Effect, Context } from "effect";
import { PersistedGraphListItem } from "../interfaces/graph/graph-items";
import {
  ModelEncodedAddableUserLogin,
  ModelEncodedPersistedUserLogin,
} from "../interfaces/user-login";

export class UserLoginsGraphListAccess extends Context.Tag(
  "UserLoginsGraphListAccess"
)<
  UserLoginsGraphListAccess,
  {
    readonly getUserLoginGraphListItemsByFilter: (
      filter?: string
    ) => Effect.Effect<
      PersistedGraphListItem<ModelEncodedPersistedUserLogin>[]
    >;

    readonly createUserLoginGraphListItem: (
      fields: ModelEncodedAddableUserLogin
    ) => Effect.Effect<PersistedGraphListItem<ModelEncodedPersistedUserLogin>>;
  }
>() {}
