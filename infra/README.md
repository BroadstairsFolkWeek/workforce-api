# Infrastructure: Manual and Automatic provisioning

The aim is to automate infrastructure provisioning as far as possible, but there are some initial provisioning
steps that need to be completed manually.

The manual steps are those that need to be carried out at a higher priviledge level, applying configuration
such that later automated provisioning tasks can be carried out with priviledged scoped to only those
resources affected by provisioning.

Note, the manual steps require use of the Azure CLI, logged in as a user with at least Contributor role
for the subscription the resources will be provisioned under.

## Manual step: Create a resource group

Name the resource group according the environment being provisioned.

```
az group create --name rg-bfwworkforceservices-dev --location uksouth
```

## Manual step: Create a Service Principal to run provisioning

This Service Principal shall have RBAC configured to only allow contributions against the
resource group created above.

The Application underlying the Service Principal shall be configured to accept Federated
Credentials from GitHub. This will allow GitHub Actions to log into Azure as the Service Principal.

Create the app

```
az ad app create --display-name GitHub-WFServices-Provisioning
```

From the JSON output, record the appId as the ClientID, and the id as the ApplicationObjectId

Create the service principal

```
az ad sp create --id $ClientId
```

From the JSON output, record the id as this will be used as the $ServicePrincipalObjectId below.

Assign both the Contributor and Role Based Access Administrator roles to the service principal,
scoped to the resource group. Replace $ServicePrincipalObjectId, $subscriptionId and $resourceGroupName
below accordingly.

```
az role assignment create --role contributor --subscription $subscriptionId --assignee-object-id $ServicePrincipalObjectId --assignee-principal-type ServicePrincipal --scope /subscriptions/$subscriptionId/resourceGroups/$resourceGroupName

az role assignment create --role "Role Based Access Administrator" --subscription $subscriptionId --assignee-object-id $ServicePrincipalObjectId --assignee-principal-type ServicePrincipal --scope /subscriptions/$subscriptionId/resourceGroups/$resourceGroupName
```

Create a file, credential.json, populated similar to the following:

```
{
    "name": "WFServices-Provisioning-GitHubCredential",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:BroadstairsFolkWeek/workforce-api:ref:refs/heads/main",
    "description": "GitHub Actions credential for deployment of WF Services resources",
    "audiences": [
        "api://AzureADTokenExchange"
    ]
}
```

Adjust subject according to the 'sub' claim that will be in the token
issued by GitHub's OIDC provider. This ensures that only that request
from the correct repository and branch are trusted.

See https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#example-subject-claims for information on how the sub claim is assembled.

To apply the federated credential, described in the credential.json file,
to the application, run the following:

```
az ad app federated-credential create --id $ApplicationObjectId --parameters credential.json
```

Once the above steps have been run, apply the following secrets to the
github repository:

- AZURE_CLIENT_ID
- AZURE_TENANT_ID
- AZURE_SUBSCRIPTION_ID
