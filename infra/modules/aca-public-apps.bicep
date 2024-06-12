param environmentId string
param location string
param managedIdentityId string
param tags object
param trafficDistribution array

resource workforceapi 'Microsoft.App/containerApps@2023-11-02-preview' = {
  name: 'workforce-api'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}' : {}
    }
  }
  properties: {
    environmentId: environmentId
    configuration: {
      ingress: { 
        external: true
        targetPort: 3000
        transport: 'http'
        clientCertificateMode: 'ignore'
        traffic: trafficDistribution
      }
      activeRevisionsMode: 'Multiple'
      maxInactiveRevisions: 2
    }
    template: {
      containers: [
        {
          name: 'workforce-api'
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
}

output workforceApiUri string = 'https://${workforceapi.properties.configuration.ingress.fqdn}'
