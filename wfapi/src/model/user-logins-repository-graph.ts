import { Effect, Layer } from "effect";
import { Schema } from "@effect/schema";
import {
  ModelAddableUserLogin,
  ModelPersistedUserLogin,
  ModelUserId,
} from "./interfaces/user-login";
import {
  UserLoginNotFound,
  UserLoginRepository,
} from "./user-logins-repository";
import { UserLoginsGraphListAccess } from "./graph/user-logins-graph-list-access";
import {
  PersistedGraphListItem,
  PersistedGraphListItemFields,
} from "./interfaces/graph/graph-items";

const fieldsToUserLogin = (fields: PersistedGraphListItemFields) =>
  Schema.decodeUnknown(ModelPersistedUserLogin)(fields);

const graphListItemToUserLogin = (
  item: PersistedGraphListItem<PersistedGraphListItemFields>
) => {
  return fieldsToUserLogin(item.fields);
};

const modelGetUserLoginsByFilter = (filter: string) => {
  return UserLoginsGraphListAccess.pipe(
    Effect.flatMap((listAccess) =>
      listAccess.getUserLoginGraphListItemsByFilter(filter)
    ),
    Effect.head,
    Effect.catchTag("NoSuchElementException", () =>
      Effect.fail(new UserLoginNotFound())
    ),
    Effect.flatMap((item) => graphListItemToUserLogin(item)),
    // Parse errors of data from Graph/SharePoint are considered unrecoverable.
    Effect.catchTag("ParseError", (e) => Effect.die(e))
  );
};

const modelGetUserLoginByIdentityProviderUserId = (id: string) => {
  return modelGetUserLoginsByFilter(`fields/IdentityProviderUserId eq '${id}'`);
};

const modelCreateUserLogin = (userLogin: ModelAddableUserLogin) => {
  return UserLoginsGraphListAccess.pipe(
    Effect.andThen((listAccess) =>
      Schema.encode(ModelAddableUserLogin)(userLogin).pipe(
        Effect.andThen(listAccess.createUserLoginGraphListItem)
      )
    ),
    Effect.andThen(graphListItemToUserLogin),
    // Parse errors of data from Graph/SharePoint are considered unrecoverable.
    Effect.catchTag("ParseError", (e) => Effect.die(e))
  );
};

export const userLoginRepositoryLive = Layer.effect(
  UserLoginRepository,
  UserLoginsGraphListAccess.pipe(
    Effect.map((service) => ({
      modelGetUserLoginByIdentityProviderUserId: (userId: ModelUserId) =>
        modelGetUserLoginByIdentityProviderUserId(userId).pipe(
          Effect.provideService(UserLoginsGraphListAccess, service)
        ),

      modelCreateUserLogin: (userLogin: ModelAddableUserLogin) =>
        modelCreateUserLogin(userLogin).pipe(
          Effect.provideService(UserLoginsGraphListAccess, service)
        ),
    }))
  )
);
