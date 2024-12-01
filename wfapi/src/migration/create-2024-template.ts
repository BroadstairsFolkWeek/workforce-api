import { Effect } from "effect";
import { runWfApiEffect } from "../api-server/effect-runner";
import { workforceApplicationFormSpec } from "../model/wf-application-forms/wf-application-form-spec";
import { TemplatesRepository } from "../model/templates-repository";

// Create the 2024 template in the template repository based on the hard-coded const, workforceApplicationFormSpec.
export const create2024Template = async () => {
  const template = workforceApplicationFormSpec;

  const program = TemplatesRepository.pipe(
    Effect.andThen((templateRepository) =>
      templateRepository
        .getTemplateById(template.id)
        .pipe(
          Effect.catchTag("TemplateNotFound", () =>
            templateRepository.createTemplate(template)
          )
        )
    )
  );

  runWfApiEffect(program);
};
