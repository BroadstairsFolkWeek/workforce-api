using '../main.bicep'

param environment = 'dev'
param location = 'uksouth'

param tags = {
  application: 'workforce-services'
  environment: environment
}
param trafficDistribution = [
  {
    latestRevision: true
    weight: 100
  }
]

param containerRegistryName = 'workforceservicesacrdev'
