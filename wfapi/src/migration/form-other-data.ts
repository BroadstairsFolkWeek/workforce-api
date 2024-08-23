import { Array, Effect } from "effect";
import { runWfApiEffect } from "../api-server/effect-runner";
import { getForms } from "../forms/forms";
import { getOtherData } from "../forms/form-actions";
import { FormProvider } from "../forms/providers/form-provider";

// Update the 'other data' on forms according to the associated profile.
export const setFormOtherData = async () => {
  const program = FormProvider.pipe(
    Effect.andThen((formProvider) =>
      getForms().pipe(
        Effect.tap((forms) =>
          Effect.logTrace(`setFormOtherData: Retrieved ${forms.length} forms`)
        ),
        // Only set the otherData property on the form if it has not already been set.
        Effect.andThen(
          Array.filter(
            (form) => Object.keys(form.otherData as any).length === 0
          )
        ),
        Effect.andThen(
          Array.map((form) => {
            const profile = form.profile;
            const otherData = getOtherData(profile)(form);
            return formProvider.updateFormSubmissionStatusByFormProviderSubmissionId(
              form.formProviderId,
              form.formProviderSubmissionId
            )(profile.id)(form.submissionStatus, otherData);
          })
        ),
        Effect.andThen(Effect.all),
        Effect.catchTag("FormSubmissionNotFound", (e) => Effect.succeedNone)
      )
    )
  );

  runWfApiEffect(program);
};
