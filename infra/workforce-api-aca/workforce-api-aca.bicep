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

@description('Array that represents desired traffic distribution between container apps revisions')
param trafficDistribution array

@description('Location where resources will be provisioned')
param location string

@description('Tags to be applied to all resources in this deployment')
param tags object

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
        traffic: trafficDistribution
        allowInsecure: false
      }
      activeRevisionsMode: 'Multiple'
      maxInactiveRevisions: 2
      secrets: [
        {
          name: 'app-client-secret'
          value: appAadClientSecret
        }
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
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: 3000
              }
              initialDelaySeconds: 3
              periodSeconds: 3
              failureThreshold: 5
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: 3000
              }
              initialDelaySeconds: 3
              periodSeconds: 3
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }

  resource authConfigs 'authConfigs' = {
    name: 'current'
    properties: {
      globalValidation: {
        unauthenticatedClientAction: 'Return401'
      }
      login: {
        routes: {
          logoutEndpoint: '/logout'
        }
      }
      identityProviders: {
        azureActiveDirectory: {
          enabled: true
          registration: {
            clientId: appAadClientId
            clientSecretSettingName: 'app-client-secret'
            openIdIssuer: '${environment().authentication.loginEndpoint}v2.0/${appAadTenantId}'
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
