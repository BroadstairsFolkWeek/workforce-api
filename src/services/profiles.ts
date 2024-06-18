import { Effect } from "effect";
import { ModelUserId } from "../model/interfaces/user-login";
import { getUserLogin } from "./users";
import { ProfilesRepository } from "../model/profiles-repository";

export const getProfileByUserId = (userId: ModelUserId) =>
  getUserLogin(userId).pipe(
    Effect.andThen((userLogin) =>
      ProfilesRepository.pipe(
        Effect.andThen((repo) =>
          repo.modelGetProfileByProfileId(userLogin.profileId)
        )
      )
    )
  );

export const getProfiles = () =>
  ProfilesRepository.pipe(Effect.andThen((repo) => repo.modelGetProfiles()));
