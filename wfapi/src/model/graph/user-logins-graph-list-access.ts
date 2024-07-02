import { Effect, Context } from "effect";
import { PersistedGraphListItem } from "../interfaces/graph/graph-list-items";
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
      readonly PersistedGraphListItem<ModelEncodedPersistedUserLogin>[]
    >;

    readonly createUserLoginGraphListItem: (
      fields: ModelEncodedAddableUserLogin
    ) => Effect.Effect<PersistedGraphListItem<ModelEncodedPersistedUserLogin>>;
  }
>() {}
