import { Effect, Context } from "effect";
import {
  ModelAddableUserLogin,
  ModelPersistedUserLogin,
  ModelUserId,
} from "./interfaces/user-login";

export class UserLoginNotFound {
  readonly _tag = "UserLoginNotFound";
}

export class UserLoginRepository extends Context.Tag("UserLoginRepository")<
  UserLoginRepository,
  {
    readonly modelGetUserLoginByIdentityProviderUserId: (
      userId: ModelUserId
    ) => Effect.Effect<ModelPersistedUserLogin, UserLoginNotFound>;

    readonly modelCreateUserLogin: (
      addableUserLogin: ModelAddableUserLogin
    ) => Effect.Effect<ModelPersistedUserLogin>;
  }
>() {}
