metadata description = 'Provision an Azure Container Apps environment, along with supporting resources, that can be used later to deploy Azure Container Apps to.'

@description('Element to be incorporated in resource names to ensure uniqueness in Azure.')
@minLength(5)
@maxLength(10)
param resourceUniqueNameElement string

@description('Name of the environment these provisioned resources relate to. Will be incoporated into resource names.')
@allowed(['dev', 'test', 'prod'])
param environmentName string

@description('Location where resources will be provisioned')
param location string = 'uksouth'

@description('Tags to be applied to all resources in this deployment')
param tags object = {
  application: 'workforce-services'
  environment: environmentName
}

@description('Common part of the name of the resources to be created')
var resourceBaseName = 'bfwwfapi${environmentName}${resourceUniqueNameElement}'


@description('Module that provisions common resources that will be re-used by other resources in the deployment, like managed identities')
module common 'modules/common.bicep' = {
  name: 'common-resources'
  params: {
    resourceBaseName: resourceBaseName
    location: location 
    tags: tags
  }
}

@description('Module that provisions Azure Monitor resources, like Log Analytics workspace and Application Insights.')
module azure_monitor 'modules/azure-monitor.bicep' = {
  name: 'azure-monitor'
  params: {
    resourceBaseName: resourceBaseName
    location: location
    managedIdentityId: common.outputs.managedIdentityId
    tags: tags
  }
}

@description('Module that provisions common overall resources for Azure Container Apps, like Azure Container Apps environment.')
module aca_common 'modules/aca-common.bicep' = {
  name: 'aca-common'
  params: {
    resourceBaseName: resourceBaseName
    location: location
    logAnalyticsWorkspaceId: azure_monitor.outputs.logAnalyticsWorkspaceId
    managedIdentityId: common.outputs.managedIdentityId
    managedIdentityPrincipalId: common.outputs.managedIdentityPrincipalId
    tags: tags
  }
}
