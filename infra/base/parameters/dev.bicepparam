using '../base.bicep'

param resourceUniqueNameElement = readEnvironmentVariable('RESOURCE_SUFFIX')

param environmentName = 'dev'
  
param location = 'uksouth'

param tags = {
  application: 'workforce-services'
  environment: environmentName
}
