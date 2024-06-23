import { Effect } from "effect";
import { TokenCredential } from "@azure/identity";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { Client } from "@microsoft/microsoft-graph-client";

import "isomorphic-fetch";

const getAuthProvider = (credential: TokenCredential) =>
  Effect.succeed(
    new TokenCredentialAuthenticationProvider(credential, {
      scopes: ["https://graph.microsoft.com/.default"],
    })
  );

export const getGraphClient = (credential: TokenCredential) =>
  getAuthProvider(credential).pipe(
    Effect.map((authProvider) =>
      Client.initWithMiddleware({
        authProvider: authProvider,
      })
    )
  );
