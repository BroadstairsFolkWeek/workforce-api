import { create2024Template } from "./create-2024-template";
import { setFormOtherData } from "./form-other-data";

export const runDataMigration = async () => {
  setFormOtherData();
  create2024Template();
};
