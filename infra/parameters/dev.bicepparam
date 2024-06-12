using '../main.bicep'

param acaResourceGroupName = 'rg-bfwworkforceservices-${environment}'
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

// Command to get revision names: az containerapp revision list --name aca-hello-world --resource-group rg-aca-helloworld-neu-dev --query [].name -o tsv
