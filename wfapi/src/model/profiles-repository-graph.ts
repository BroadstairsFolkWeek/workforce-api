import { Effect, Layer } from "effect";
import { Schema } from "@effect/schema";
import { ProfileNotFound, ProfilesRepository } from "./profiles-repository";
import { ProfilesGraphListAccess } from "./graph/profiles-graph-list-access";
import {
  ModelAddableProfile,
  ModelPersistedProfile,
  ModelProfileId,
  ModelProfileUpdates,
} from "./interfaces/profile";
import {
  PersistedGraphListItem,
  PersistedGraphListItemFields,
} from "./interfaces/graph/graph-list-items";

const fieldsToProfile = (fields: PersistedGraphListItemFields) =>
  Schema.decodeUnknown(ModelPersistedProfile)(fields);

const graphListItemToProfile = (
  item: PersistedGraphListItem<PersistedGraphListItemFields>
) => {
  return fieldsToProfile(item.fields);
};

const modelGetProfileGraphListItemByFilter = (filter: string) =>
  ProfilesGraphListAccess.pipe(
    Effect.flatMap((listAccess) =>
      listAccess.getProfileGraphListItemsByFilter(filter)
    ),
    Effect.head
  );

const modelGetProfileByFilter = (filter: string) =>
  modelGetProfileGraphListItemByFilter(filter).pipe(
    Effect.flatMap((item) => graphListItemToProfile(item)),
    // Parse errors of data from Graph/SharePoint are considered unrecoverable.
    Effect.catchTag("ParseError", (e) => Effect.die(e))
  );

const modelGetProfileGraphListItemByProfileId = (profileId: ModelProfileId) =>
  modelGetProfileGraphListItemByFilter(
    `fields/ProfileId eq '${profileId}'`
  ).pipe(
    Effect.catchTag("NoSuchElementException", () =>
      Effect.fail(new ProfileNotFound({ profileId }))
    )
  );

const modelGetProfileByProfileId = (profileId: ModelProfileId) => {
  return modelGetProfileByFilter(`fields/ProfileId eq '${profileId}'`).pipe(
    Effect.catchTag("NoSuchElementException", () =>
      Effect.fail(new ProfileNotFound({ profileId }))
    )
  );
};

const getProfileListItemIdIdForProfileId = (profileId: ModelProfileId) =>
  modelGetProfileGraphListItemByProfileId(profileId).pipe(
    Effect.map((item) => item.id!)
  );

const modelGetProfiles = () => {
  return ProfilesGraphListAccess.pipe(
    Effect.flatMap((listAccess) =>
      listAccess.getProfileGraphListItemsByFilter()
    ),
    Effect.flatMap(Effect.forEach(graphListItemToProfile)),
    // Parse errors of data from Graph/SharePoint are considered unrecoverable.
    Effect.catchTag("ParseError", (e) => Effect.die(e))
  );
};

const modelCreateProfile = (addableProfile: ModelAddableProfile) => {
  return ProfilesGraphListAccess.pipe(
    Effect.andThen((listAccess) =>
      Schema.encode(ModelAddableProfile)(addableProfile).pipe(
        Effect.andThen(listAccess.createProfileGraphListItem)
      )
    ),
    Effect.andThen(graphListItemToProfile),
    // Parse errors of data from Graph/SharePoint are considered unrecoverable.
    Effect.catchTag("ParseError", (e) => Effect.die(e))
  );
};

const updateProfile = (
  profileId: ModelProfileId,
  updates: ModelProfileUpdates
) =>
  getProfileListItemIdIdForProfileId(profileId).pipe(
    Effect.andThen((listItemId) =>
      ProfilesGraphListAccess.pipe(
        Effect.andThen((listAccess) =>
          Schema.encode(ModelProfileUpdates)(updates).pipe(
            Effect.andThen(listAccess.updateProfileGraphListItem(listItemId)),
            Effect.andThen(fieldsToProfile),

            // Parse errors of data from Graph/SharePoint are considered unrecoverable.
            Effect.catchTag("ParseError", (e) => Effect.die(e))
          )
        )
      )
    )
  );

const deleteProfileByProfileId = (profileId: ModelProfileId) =>
  modelGetProfileByProfileId(profileId).pipe(
    Effect.andThen((profile) =>
      ProfilesGraphListAccess.pipe(
        Effect.andThen((listAccess) =>
          listAccess.deleteProfileGraphListItem(profile.dbId)
        ),
        Effect.andThen(profile)
      )
    )
  );

export const profilesRepositoryLive = Layer.effect(
  ProfilesRepository,
  ProfilesGraphListAccess.pipe(
    Effect.map((service) => ({
      modelCreateProfile: (addableProfile: ModelAddableProfile) =>
        modelCreateProfile(addableProfile).pipe(
          Effect.provideService(ProfilesGraphListAccess, service)
        ),

      modelGetProfileByProfileId: (profileId: ModelProfileId) =>
        modelGetProfileByProfileId(profileId).pipe(
          Effect.provideService(ProfilesGraphListAccess, service)
        ),

      modelGetProfiles: () =>
        modelGetProfiles().pipe(
          Effect.provideService(ProfilesGraphListAccess, service)
        ),

      modelUpdateProfile: (
        profileId: ModelProfileId,
        updates: ModelProfileUpdates
      ) =>
        updateProfile(profileId, updates).pipe(
          Effect.provideService(ProfilesGraphListAccess, service)
        ),

      modelDeleteProfileByProfileId: (profileId: ModelProfileId) =>
        deleteProfileByProfileId(profileId).pipe(
          Effect.provideService(ProfilesGraphListAccess, service)
        ),
    }))
  )
);
