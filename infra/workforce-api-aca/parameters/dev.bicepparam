using '../workforce-api-aca.bicep'

param resourceUniqueNameElement = readEnvironmentVariable('RESOURCE_SUFFIX')

param containerImage = readEnvironmentVariable('CONTAINER_IMAGE')

param environmentName = 'dev'

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

