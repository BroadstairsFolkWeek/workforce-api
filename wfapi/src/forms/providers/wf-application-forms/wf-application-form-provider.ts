import { Context } from "effect";
import { FormProvider } from "../form-provider";

export class WfApplicationFormProvider extends Context.Tag(
  "WfApplicationFormProvider"
)<WfApplicationFormProvider, Context.Tag.Service<FormProvider>>() {}
