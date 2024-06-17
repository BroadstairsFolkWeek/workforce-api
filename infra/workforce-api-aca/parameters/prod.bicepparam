using '../workforce-api-aca.bicep'

param resourceUniqueNameElement = readEnvironmentVariable('RESOURCE_SUFFIX')

param containerImage = readEnvironmentVariable('CONTAINER_IMAGE')

param appAadClientId = readEnvironmentVariable('APP_AAD_CLIENT_ID')
param appAadClientSecret = readEnvironmentVariable('APP_AAD_CLIENT_SECRET')
param appAadTenantId = readEnvironmentVariable('APP_AAD_TENANT_ID')

param environmentName = 'prod'

param location = 'uksouth'

param tags = {
  application: 'workforce-services'
  environment: environmentName
}

param trafficDistribution = [
  {
    latestRevision: true
    weight: 100
  }
]
