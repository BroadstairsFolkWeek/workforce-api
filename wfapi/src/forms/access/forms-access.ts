import { Context } from "effect";
import { FormsRepository } from "../../model/forms-repository";

export class FormsAccess extends Context.Tag("FormsAccess")<
  FormsAccess,
  FormsRepository
>() {}
