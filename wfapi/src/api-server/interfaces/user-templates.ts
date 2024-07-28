import { z } from "zod";

export const postCreatableFormParamsSchema = z.object({
  userId: z.string().brand("UserId"),
  formSpecId: z.string().brand("TemplateId"),
});
