import { Context } from "effect";
import { FormProvider } from "../providers/form-provider";

export class FormsAccess extends Context.Tag("FormsAccess")<
  FormsAccess,
  FormProvider
>() {}
