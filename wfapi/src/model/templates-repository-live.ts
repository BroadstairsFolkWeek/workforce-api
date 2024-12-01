import { Context, Effect, Layer } from "effect";
import { Schema } from "@effect/schema";
import { PersistedGraphListItem } from "./interfaces/graph/graph-list-items";
import { TemplateNotFound, TemplatesRepository } from "./templates-repository";
import { TemplatesGraphListAccess } from "./graph/templates-graph-list-access";
import { Template, TemplateId } from "../interfaces/form";
import {
  ModelAddableTemplate,
  ModelEncodedPersistedTemplate,
  ModelPersistedTemplate,
  ModelTemplateUpdates,
} from "./interfaces/template";

type ListAccessType = Context.Tag.Service<TemplatesGraphListAccess>;

const fieldsToTemplate = (fields: ModelEncodedPersistedTemplate) =>
  Schema.decodeUnknown(ModelPersistedTemplate)(fields);

const graphListItemToTemplate = (
  item: PersistedGraphListItem<ModelEncodedPersistedTemplate>
) => {
  return fieldsToTemplate(item.fields);
};

const getTemplatesGraphListItemsByFilter =
  (listAccess: ListAccessType) => (filter: string) =>
    listAccess.getTemplateGraphListItemsByFilter(filter);

const getSingleTemplateGraphListItemByFilter =
  (listAccess: ListAccessType) => (filter: string) =>
    getTemplatesGraphListItemsByFilter(listAccess)(filter).pipe(Effect.head);

const getTemplateGraphListItemById =
  (listAccess: ListAccessType) => (templateId: TemplateId) =>
    getSingleTemplateGraphListItemByFilter(listAccess)(
      `fields/Title eq '${templateId}'`
    ).pipe(
      Effect.catchTag("NoSuchElementException", () =>
        Effect.fail(new TemplateNotFound({ templateId }))
      )
    );

const getTemplateById =
  (listAccess: ListAccessType) => (TemplateId: TemplateId) =>
    getTemplateGraphListItemById(listAccess)(TemplateId).pipe(
      Effect.andThen(graphListItemToTemplate),
      Effect.catchTag("ParseError", (e) => Effect.die(e))
    );

const getTemplates =
  (listAccess: ListAccessType) => (): Effect.Effect<Template[]> =>
    getTemplatesGraphListItemsByFilter(listAccess)("").pipe(
      Effect.flatMap(Effect.forEach(graphListItemToTemplate)),
      Effect.catchTag("ParseError", (e) => Effect.die(e))
    );

const createTemplate =
  (listAccess: ListAccessType) => (addableTemplate: Template) =>
    Schema.encode(ModelAddableTemplate)(addableTemplate).pipe(
      Effect.andThen(listAccess.createTemplateGraphListItem),
      Effect.andThen(graphListItemToTemplate),
      // Parse errors of data from Graph/SharePoint are considered unrecoverable.
      Effect.catchTag("ParseError", (e) => Effect.die(e))
    );

const updateTemplate =
  (listAccess: ListAccessType) =>
  (
    templateId: TemplateId,
    updates: Template
  ): Effect.Effect<Template, TemplateNotFound> =>
    Schema.encode(ModelTemplateUpdates)(updates).pipe(
      Effect.andThen((encodedUpdates) =>
        getTemplateGraphListItemById(listAccess)(templateId).pipe(
          Effect.andThen((listItem) => listItem.fields.id),
          Effect.andThen((dbId) =>
            listAccess.updateTemplateGraphListItem(dbId)(encodedUpdates)
          ),
          Effect.andThen(fieldsToTemplate)
        )
      ), // Parse errors of data from Graph/SharePoint are considered unrecoverable.
      Effect.catchTag("ParseError", (e) => Effect.die(e))
    );

export const templatesRepositoryLive = Layer.effect(
  TemplatesRepository,
  TemplatesGraphListAccess.pipe(
    Effect.map((service) => ({
      getTemplateById: getTemplateById(service),

      getTemplates: getTemplates(service),

      createTemplate: createTemplate(service),

      updateTemplate: updateTemplate(service),
    }))
  )
);
