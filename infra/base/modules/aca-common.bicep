@minLength(3)
param resourceBaseName string

param location string
param logAnalyticsWorkspaceId string
param managedIdentityId string
param managedIdentityPrincipalId string
param tags object

var acrPushPullRole = resourceId('Microsoft.Authorization/roleDefinitions', '8311e382-0749-4cb8-b61a-304f252e45ec')

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-11-02-preview' = {
  name: 'cae-${resourceBaseName}'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    appLogsConfiguration: {
      /* In this demo Azure Monitor is configured as ACA logs destination: https://learn.microsoft.com/en-us/azure/container-apps/log-options
       * If you would like to see how 'Log Analytics' option is configured, please check out ./aks-store-on-aca/modules/aca-common.bicep file
      */
      destination: 'azure-monitor'
    }
  }
  tags: tags
}

@description('Diagnostic setting for the ACA environment that\'s required when Azure Monitor is configured as logs destination.')
resource acaEnvironmentDiagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: containerAppsEnvironment.name
  scope: containerAppsEnvironment
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: 'cr${resourceBaseName}'
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {}
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: containerRegistry
  name: guid(containerRegistry.id, managedIdentityPrincipalId, acrPushPullRole)
  properties: {
    roleDefinitionId: acrPushPullRole
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output defaultDomain string = containerAppsEnvironment.properties.defaultDomain
output environmentId string = containerAppsEnvironment.id
output containerRegistryId string = containerRegistry.id
output containerRegistryName string = containerRegistry.name
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
