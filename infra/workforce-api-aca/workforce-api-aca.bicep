metadata description = 'Deploy the workforce-api Azure Container App'

@description('Container image to deploy to the azure container app')
param containerImage string 

@description('Element to be incorporated in resource names to ensure uniqueness in Azure.')
@minLength(5)
@maxLength(10)
param resourceUniqueNameElement string

@description('The Client ID used for authenticating the workforce-api application to the AAD authentication provider')
@secure()
param appAadClientId string

@description('The Client Secret used for authenticating the workforce-api application to the AAD authentication provider')
@secure()
param appAadClientSecret string

@description('The Tenant ID of the AAD authentication provider')
@secure()
param appAadTenantId string

@description('Name of the environment these provisioned resources relate to. Will be incoporated into resource names.')
@allowed(['dev', 'test', 'prod'])
param environmentName string

@description('Tenant ID of the registered application that will be used to access the Microsoft Graph API')
param graphTenantId string
@description('Client ID of the registered application that will be used to access the Microsoft Graph API')
param graphClientId string
@description('Client Secret of the registered application that will be used to access the Microsoft Graph API')
@secure()
param graphClientSecret string

@description('Hostname of the Workforce SharePoint site that contains lists and libraries used by the workforce-api')
param workforceSiteHostname string
@description('Path to the Workforce SharePoint site that contains lists and libraries used by the workforce-api')
param workforceSitePath string
@description('GUID of the Workforce Profiles list in the Workforce SharePoint site')
param workforceProfilesListGuid string
@description('GUID of the Workforce User Logins list in the Workforce SharePoint site')
param workforceLoginsListGuid string

@description('Base URL for the Workforce Photos Service')
param wfPhotosServiceBaseUrl string

@description('Location where resources will be provisioned')
param location string = 'uksouth'

@description('Tags to be applied to all resources in this deployment')
param tags object = {
  application: 'workforce-services'
  environment: environmentName
}

@description('Minimum number of replicas for the workforce-api Azure Container App')
param minReplicas int = 1
@description('Maximum number of replicas for the workforce-api Azure Container App')
param maxReplicas int = 1

@description('Common part of the name of the resources to be created')
var resourceBaseName = 'bfwwfapi${environmentName}${resourceUniqueNameElement}'


resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2018-11-30' existing = {
  name: 'uaid-${resourceBaseName}'
}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-11-02-preview' existing = {
  name: 'cae-${resourceBaseName}'
}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' existing = {
  name: 'cr${resourceBaseName}'
}



resource workforceapi 'Microsoft.App/containerApps@2023-11-02-preview' = {
  name: 'workforce-api'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}' : {}
    }
  }
  properties: {
    environmentId: containerAppsEnvironment.id
    configuration: {
      registries: [
        {
          server: containerRegistry.properties.loginServer
          identity: managedIdentity.id
        }
      ]
      ingress: { 
        external: true
        targetPort: 3000
        transport: 'http'
        clientCertificateMode: 'ignore'
        allowInsecure: false
      }
      activeRevisionsMode: 'Single'
      maxInactiveRevisions: 2
      secrets: [
        {
          name: 'app-client-secret'
          value: appAadClientSecret
        }
        {name: 'graph-tenant-id', value: graphTenantId}
        {name: 'graph-client-id', value: graphClientId}
        {name: 'graph-client-secret', value: graphClientSecret}
        {name: 'workforce-site-hostname', value: workforceSiteHostname}
        {name: 'workforce-site-path', value: workforceSitePath}
        {name: 'workforce-profiles-list-guid', value: workforceProfilesListGuid}
        {name: 'workforce-logins-list-guid', value: workforceLoginsListGuid}
        {name: 'wf-photos-service-base-url', value: wfPhotosServiceBaseUrl}
      ]
    }
    template: {
      containers: [
        {
          name: 'workforce-api'
          image: containerImage
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {name: 'AZURE_TENANT_ID', secretRef: 'graph-tenant-id'}
            {name: 'AZURE_CLIENT_ID', secretRef: 'graph-client-id'}
            {name: 'AZURE_CLIENT_SECRET', secretRef: 'graph-client-secret'}
            {name: 'WORKFORCE_SITE_HOSTNAME', secretRef: 'workforce-site-hostname'}
            {name: 'WORKFORCE_SITE_PATH', secretRef: 'workforce-site-path'}
            {name: 'WORKFORCE_PROFILES_LIST_GUID', secretRef: 'workforce-profiles-list-guid'}
            {name: 'WORKFORCE_LOGINS_LIST_GUID', secretRef: 'workforce-logins-list-guid'}
            {name: 'WF_PHOTOS_SERVICE_BASE_URL', secretRef: 'wf-photos-service-base-url'}
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }

  resource authConfigs 'authConfigs' = {
    name: 'current'
    properties: {
      globalValidation: {
        unauthenticatedClientAction: 'Return401'
      }
      identityProviders: {
        azureActiveDirectory: {
          enabled: true
          registration: {
            clientId: appAadClientId
            clientSecretSettingName: 'app-client-secret'
            openIdIssuer: '${environment().authentication.loginEndpoint}${appAadTenantId}'
          }
          validation: {
            allowedAudiences: [
              'api://${appAadClientId}'
            ]
          }
        }
      }
      platform:{
        enabled: true
      }
    }
  }
}

@description('URL for accessing Workforce API application')
output workforceApiUri string = 'https://${workforceapi.properties.configuration.ingress.fqdn}'
