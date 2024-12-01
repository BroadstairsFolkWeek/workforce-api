import { Array, Brand, Data, Effect, HashMap, Match } from "effect";

import { ModelUserId } from "../model/interfaces/user-login";
import {
  Template,
  TemplateId,
  FormSubmissionAction,
  FormSubmissionId,
  FormSubmissionWithSpecAndActions,
  UnverifiedFormSubmission,
} from "../interfaces/form";
import { FormsRepository, FormSpecNotFound } from "../model/forms-repository";
import {
  verifyFormsAgainstProfiles,
  verifyFormSubmissionAgainstProfile,
  verifyFormSubmissionsAgainstProfile,
} from "./form-validation";
import {
  addAvailableActions,
  applyActionToFormSubmission,
  FormActionResult,
  getAvailableFormActions,
} from "./form-actions";
import { getUser } from "../services/users";
import { UserId } from "../interfaces/user";
import { Profile, WithProfile } from "../interfaces/profile";
import { getProfilesHashMapByProfileIds } from "../services/profiles";
import {
  ProfileNotFound,
  ProfilesRepository,
} from "../model/profiles-repository";
import { PhotosRepository } from "../model/photos-repository";

export class FormSubmissionNotFound extends Data.TaggedClass(
  "FormSubmissionNotFound"
) {}

export class InvalidFormSubmissionStatus extends Data.TaggedClass(
  "InvalidFormSubmissionStatus"
) {}

class ActionResultStatusUpdated extends Data.TaggedClass(
  "ActionResultStatusUpdated"
)<{ readonly formSubmission: FormSubmissionWithSpecAndActions }> {}

class ActionFormSubmissionDeleted extends Data.TaggedClass(
  "ActionFormSubmissionDeleted"
) {}

export type ActionFormResult = ActionResultStatusUpdated;

const getFormSpecsForFormSpecIds = (formSpecIds: Set<TemplateId>) =>
  FormsRepository.pipe(
    Effect.andThen((formProvider) =>
      Effect.forEach(formSpecIds, (formSpecId) =>
        formProvider.getFormSpec(formSpecId)
      )
    )
  );

const getFormSpecsForForms = (
  formSubmissions: readonly UnverifiedFormSubmission[]
) => {
  // Get the unique set of formSpecIds from the form submissions
  const formSpecIds = new Set(
    formSubmissions.map((formSubmission) => formSubmission.templateId)
  );
  return getFormSpecsForFormSpecIds(formSpecIds).pipe(
    Effect.catchTags({
      FormSpecNotFound: (e) =>
        Effect.dieMessage(
          `Data consistency error: FormSpec not found but is referenced by a FormSubmission: ${e.formSpecId}`
        ),
    })
  );
};

const getProfilesForForms = (forms: readonly UnverifiedFormSubmission[]) => {
  // Get the unique set of profile Ids from the forms
  const profileIds = new Set(
    forms.map((formSubmission) => formSubmission.profileId)
  );
  return getProfilesHashMapByProfileIds(profileIds).pipe(
    Effect.catchTags({
      ProfileNotFound: (e) =>
        Effect.dieMessage(
          `Data consistency error: Profile not found but is referenced by a Form: ${e.profileId}`
        ),
    })
  );
};

export const mergeSubmissionWithSpec =
  (formSubmission: UnverifiedFormSubmission) => (template: Template) => ({
    ...formSubmission,
    template,
  });

const mergeSubmissionWithSpecs = (
  formSubmission: UnverifiedFormSubmission,
  formSpecs: readonly Template[]
) =>
  Array.findFirst(
    formSpecs,
    (formSpec) => formSpec.id === formSubmission.templateId
  ).pipe(
    Effect.map(mergeSubmissionWithSpec(formSubmission)),
    Effect.catchTag("NoSuchElementException", () =>
      Effect.fail(
        new FormSpecNotFound({ formSpecId: formSubmission.templateId })
      )
    )
  );

const mergeSubmissionsWithSpecs = (
  formSubmissions: readonly UnverifiedFormSubmission[],
  formSpecs: readonly Template[]
) =>
  Effect.forEach(formSubmissions, (formSubmission) =>
    mergeSubmissionWithSpecs(formSubmission, formSpecs)
  );

const mergeFormsWithProfilesAndSpecs = (
  forms: readonly UnverifiedFormSubmission[],
  formSpecs: readonly Template[],
  profiles: HashMap.HashMap<string & Brand.Brand<"ProfileId">, Profile>
) =>
  Effect.forEach(forms, (form) =>
    HashMap.get(profiles, form.profileId).pipe(
      Effect.catchTag("NoSuchElementException", () =>
        Effect.fail(new ProfileNotFound({ profileId: form.profileId }))
      ),
      Effect.andThen((profile) =>
        mergeSubmissionWithSpecs(form, formSpecs).pipe(
          Effect.andThen(verifyFormSubmissionAgainstProfile(profile)),
          Effect.andThen((verifiedForm) => ({
            ...verifiedForm,
            profile,
          }))
        )
      )
    )
  );

export const getFormsByProfile = (profile: Profile) =>
  FormsRepository.pipe(
    Effect.andThen((formProvider) =>
      formProvider.getActiveFormSubmissionsByProfileId(profile.id)
    ),
    Effect.andThen((formSubmissions) =>
      getFormSpecsForForms(formSubmissions).pipe(
        Effect.andThen((formSpecs) =>
          mergeSubmissionsWithSpecs(formSubmissions, formSpecs)
        ),
        Effect.andThen(verifyFormSubmissionsAgainstProfile(profile)),
        Effect.andThen(Array.map(addAvailableActions))
      )
    ),
    Effect.catchTags({
      FormSpecNotFound: (e) =>
        Effect.dieMessage(
          `Data consistency error: FormSpec not found but is referenced by a FormSubmission: ${e.formSpecId}`
        ),
    })
  );

export const getForms = (): Effect.Effect<
  Array<FormSubmissionWithSpecAndActions & WithProfile>,
  never,
  FormsRepository | PhotosRepository | ProfilesRepository
> =>
  FormsRepository.pipe(
    Effect.andThen((provider) => provider.getActiveForms())
  ).pipe(
    Effect.andThen((forms) =>
      Effect.all([
        getFormSpecsForForms(forms),
        getProfilesForForms(forms),
      ]).pipe(
        Effect.andThen(([formSpecs, profilesMap]) =>
          mergeFormsWithProfilesAndSpecs(forms, formSpecs, profilesMap).pipe(
            Effect.andThen((mergedForms) =>
              verifyFormsAgainstProfiles(mergedForms)
            ),
            Effect.andThen(
              Array.map((f) => ({
                ...f,
                availableActions: getAvailableFormActions(f),
              }))
            )
          )
        )
      )
    ),
    Effect.catchTags({
      FormSpecNotFound: (e) =>
        Effect.dieMessage(
          `Data consistency error: FormSpec not found but is referenced by a FormSubmission: ${e.formSpecId}`
        ),
      ProfileNotFound: (e) =>
        Effect.dieMessage(
          `Data consistency error: Profile not found but is referenced by a Form: ${e.profileId}`
        ),
    })
  );

export const getFormsByUserId = (userId: UserId) =>
  getUser(userId).pipe(
    Effect.andThen((userAndProfile) =>
      getFormsByProfile(userAndProfile.profile)
    )
  );

const getFormForUserId = (
  userId: ModelUserId,
  formSubmissionId: FormSubmissionId
) =>
  getFormsByUserId(userId)
    .pipe(
      Effect.andThen(Array.findFirst((form) => form.id === formSubmissionId))
    )
    .pipe(
      Effect.catchTags({
        NoSuchElementException: () => Effect.fail(new FormSubmissionNotFound()),
      })
    );

const getFormSubmissionForProfile =
  (formSubmissionId: FormSubmissionId) => (profile: Profile) =>
    getFormsByProfile(profile)
      .pipe(
        Effect.andThen(Array.findFirst((form) => form.id === formSubmissionId))
      )
      .pipe(
        Effect.catchTags({
          NoSuchElementException: () =>
            Effect.fail(new FormSubmissionNotFound()),
        })
      );

export const updateFormSubmissionForProfile =
  (formSubmissionId: FormSubmissionId) =>
  (answers: unknown) =>
  (profile: Profile) =>
    getFormSubmissionForProfile(formSubmissionId)(profile).pipe(
      Effect.andThen((existingFormSubmission) =>
        FormsRepository.pipe(
          Effect.andThen((formProvider) =>
            formProvider.updateFormSubmissionByFormProviderSubmissionId(
              existingFormSubmission.formProviderId,
              existingFormSubmission.formProviderSubmissionId
            )(profile.id)(existingFormSubmission.submissionStatus, answers)
          ),
          Effect.andThen((updatedFormSubmission) =>
            mergeSubmissionWithSpec(updatedFormSubmission)(
              existingFormSubmission.template
            )
          ),
          Effect.andThen(verifyFormSubmissionAgainstProfile(profile)),
          Effect.andThen(addAvailableActions)
        )
      )
    );

export const updateFormSubmissionForUserId =
  (formSubmissionId: FormSubmissionId) =>
  (answers: unknown) =>
  (userId: ModelUserId) =>
    getUser(userId).pipe(
      Effect.andThen((userAndProfile) => userAndProfile.profile),
      Effect.andThen(updateFormSubmissionForProfile(formSubmissionId)(answers))
    );

export const deleteFormSubmissionForProfile =
  (formSubmissionId: FormSubmissionId) => (profile: Profile) =>
    getFormSubmissionForProfile(formSubmissionId)(profile).pipe(
      Effect.andThen((formSubmission) =>
        FormsRepository.pipe(
          Effect.andThen((provider) =>
            provider.deleteFormSubmissionByFormProviderSubmissionId(
              formSubmission.formProviderId,
              formSubmission.formProviderSubmissionId
            )
          )
        )
      )
    );

export const deleteFormSubmissionForUserId =
  (formSubmissionId: FormSubmissionId) => (userId: ModelUserId) =>
    getUser(userId).pipe(
      Effect.andThen((userAndProfile) => userAndProfile.profile),
      Effect.andThen(deleteFormSubmissionForProfile(formSubmissionId))
    );

export const executeFormSubmissionActionForProfile =
  (formSubmissionId: FormSubmissionId) =>
  (action: FormSubmissionAction) =>
  (profile: Profile) =>
    getFormSubmissionForProfile(formSubmissionId)(profile).pipe(
      Effect.andThen(applyActionToFormSubmission(action)(profile)),
      Effect.andThen(
        Match.type<FormActionResult>().pipe(
          Match.tag("FormActionResultStatusUpdated", (result) =>
            Effect.succeed(result.unverifiedFormSubmission).pipe(
              Effect.andThen(verifyFormSubmissionAgainstProfile(profile)),
              Effect.andThen(addAvailableActions),
              Effect.andThen(
                (verfiedFormSubmission) =>
                  new ActionResultStatusUpdated({
                    formSubmission: verfiedFormSubmission,
                  })
              )
            )
          ),
          Match.exhaustive
        )
      )
    );

export const executeFormSubmissionActionForUserId =
  (formSubmissionId: FormSubmissionId) =>
  (userId: ModelUserId) =>
  (action: FormSubmissionAction) =>
    getUser(userId).pipe(
      Effect.andThen((userAndProfile) => userAndProfile.profile),
      Effect.andThen(
        executeFormSubmissionActionForProfile(formSubmissionId)(action)
      )
    );

export const getCreatableFormsByProfile = (profile: Profile) =>
  FormsRepository.pipe(
    Effect.andThen((formProvider) =>
      formProvider.getCreatableFormSpecs(profile.id)
    )
  );

export const getCreatableFormsByUserId = (userId: ModelUserId) =>
  getUser(userId).pipe(
    Effect.andThen((userAndProfile) => userAndProfile.profile),
    Effect.andThen((profile) => getCreatableFormsByProfile(profile))
  );

export const createFormSubmissionForProfile =
  (profile: Profile) => (formSpecId: TemplateId) => (answers: unknown) =>
    FormsRepository.pipe(
      Effect.andThen((formProvider) =>
        formProvider
          .getCreatableFormSpec(profile.id)(formSpecId)
          .pipe(
            Effect.andThen((formSpec) =>
              formProvider
                .createFormSubmission(profile.id)(formSpec.id, answers)
                .pipe(
                  Effect.andThen((formSubmission) =>
                    mergeSubmissionWithSpec(formSubmission)(formSpec)
                  ),
                  Effect.andThen(verifyFormSubmissionAgainstProfile(profile)),
                  Effect.andThen(addAvailableActions)
                )
            )
          )
      )
    );

export const createFormSubmissionForUserId =
  (userId: ModelUserId) => (formSpecId: TemplateId) => (answers: unknown) =>
    getUser(userId).pipe(
      Effect.andThen((userAndProfile) => userAndProfile.profile),
      Effect.andThen((profile) =>
        createFormSubmissionForProfile(profile)(formSpecId)(answers)
      )
    );
