import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { ClientSecretCredential } from "@azure/identity";

import "isomorphic-fetch";
import { getTestConfig } from "./test-config";

const testConfig = getTestConfig();

const credential = new ClientSecretCredential(
  testConfig.AZURE_TENANT_ID,
  testConfig.AZURE_CLIENT_ID,
  testConfig.AZURE_CLIENT_SECRET
);

const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ["https://graph.microsoft.com/.default"],
});

const graphClient = Client.initWithMiddleware({
  authProvider: authProvider,
});

export const getTestGraphClient = () => graphClient;
