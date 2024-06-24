metadata description = 'Deploy the workforce-photos Azure Container App'

@description('Container image to deploy to the azure container app')
param containerImage string 

@description('Element to be incorporated in resource names to ensure uniqueness in Azure.')
@minLength(5)
@maxLength(10)
param resourceUniqueNameElement string

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

@description('Hostname of the Workforce SharePoint site that contains lists and libraries used by the workforce-photos service')
param workforceSiteHostname string
@description('Path to the Workforce SharePoint site that contains lists and libraries used by the workforce-photos service')
param workforceSitePath string
@description('GUID of the Workforce Photos list in the Workforce SharePoint site')
param workforcePhotosListGuid string

@description('Location where resources will be provisioned')
param location string = 'uksouth'

@description('Tags to be applied to all resources in this deployment')
param tags object = {
  application: 'workforce-services'
  environment: environmentName
}

@description('Minimum number of replicas for the workforce-photos Azure Container App')
param minReplicas int = 1
@description('Maximum number of replicas for the workforce-photos Azure Container App')
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



resource workforcephotos 'Microsoft.App/containerApps@2023-11-02-preview' = {
  name: 'workforce-photos'
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
        targetPort: 3001
        transport: 'http'
        clientCertificateMode: 'ignore'
        allowInsecure: false
      }
      activeRevisionsMode: 'Single'
      maxInactiveRevisions: 2
      secrets: [
        {name: 'graph-tenant-id', value: graphTenantId}
        {name: 'graph-client-id', value: graphClientId}
        {name: 'graph-client-secret', value: graphClientSecret}
        {name: 'workforce-site-hostname', value: workforceSiteHostname}
        {name: 'workforce-site-path', value: workforceSitePath}
        {name: 'workforce-photos-list-guid', value: workforcePhotosListGuid}
      ]
    }
    template: {
      containers: [
        {
          name: 'workforce-photos'
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
            {name: 'WORKFORCE_PHOTOS_LIST_GUID', secretRef: 'workforce-photos-list-guid'}
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 3001
              }
              initialDelaySeconds: 3
              periodSeconds: 3
              failureThreshold: 5
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 3001
              }
              initialDelaySeconds: 3
              periodSeconds: 3
              failureThreshold: 3
            }
          ]
        }
      ]
      
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
}

@description('URL for accessing Workforce Photos application')
output workforceApiUri string = 'https://${workforcephotos.properties.configuration.ingress.fqdn}'
