import { Effect, Context, Data } from "effect";
import { Template, TemplateId } from "../interfaces/form";

export class TemplateNotFound extends Data.TaggedClass("TemplateNotFound")<{
  templateId: string;
}> {}

export class TemplatesRepository extends Context.Tag("TemplatesRepository")<
  TemplatesRepository,
  {
    readonly getTemplateById: (
      templateId: TemplateId
    ) => Effect.Effect<Template, TemplateNotFound>;

    readonly getTemplates: () => Effect.Effect<Template[]>;

    readonly createTemplate: (
      addableTemplate: Template
    ) => Effect.Effect<Template>;

    readonly updateTemplate: (
      templateId: TemplateId,
      updates: Template
    ) => Effect.Effect<Template, TemplateNotFound>;
  }
>() {}
