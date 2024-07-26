import * as dotenv from "dotenv";
import { cleanEnv, str, num } from "envalid";

const output = dotenv.config({
  path: "./tests-exploratory/.env",
});

if (output.error) {
  console.error(output.error);
}

export const getTestConfig = () => {
  if (output.error) {
    throw output.error;
  }

  return cleanEnv(output.parsed, {
    AZURE_TENANT_ID: str(),
    AZURE_CLIENT_ID: str(),
    AZURE_CLIENT_SECRET: str(),
    GRAPH_SITE_HOSTNAME: str(),
    GRAPH_SITE_PATH: str(),
    GRAPH_LIST_NAME: str(),
    GRAPH_LIST_ITEM_ID: num(),
  });
};
