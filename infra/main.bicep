@description('Environment name (dev, test, prod)')
param environment string

@description('Location where resources will be provisioned')
param location string

@description('Tags to be applied to all resources in this deployment')
param tags object

@description('Array that represents desired traffic distribution between container apps revisions')
param trafficDistribution array

@description('Name of the Azure Container Registry that will be used to pull container images from')
param containerRegistryName string

@description('Module that provisions common resources that will be re-used by other resources in the deployment, like managed identities')
module common 'modules/common.bicep' = {
  name: 'common-resources'
  params: {
    environment: environment
    location: location 
    tags: tags
  }
}

@description('Module that provisions Azure Monitor resources, like Log Analytics workspace and Application Insights.')
module azure_monitor 'modules/azure-monitor.bicep' = {
  name: 'azure-monitor'
  params: {
    environment: environment
    location: location
    managedIdentityId: common.outputs.managedIdentityId
    tags: tags
  }
}

@description('Module that provisions common overall resources for Azure Container Apps, like Azure Container Apps environment.')
module aca_common 'modules/aca-common.bicep' = {
  name: 'aca-common'
  params: {
    location: location
    logAnalyticsWorkspaceId: azure_monitor.outputs.logAnalyticsWorkspaceId
    managedIdentityId: common.outputs.managedIdentityId
    managedIdentityPrincipalId: common.outputs.managedIdentityPrincipalId
    tags: tags
    containerRegistryName: containerRegistryName
  }
}

@description('Module that provisions publicly accessible applications as Azure Container Apps.')
module public_apps 'modules/aca-public-apps.bicep' = {
  name: 'public-apps'
  params: {
    environmentId: aca_common.outputs.environmentId
    location: location
    managedIdentityId: common.outputs.managedIdentityId
    tags: tags
    trafficDistribution: trafficDistribution
  }
}

@description('URL for accessing Workforce API application')
output workforceApiUri string = public_apps.outputs.workforceApiUri
