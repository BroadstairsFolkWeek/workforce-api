using '../base.bicep'

param resourceUniqueNameElement = readEnvironmentVariable('RESOURCE_SUFFIX')

param environmentName = 'dev'
  
param location = 'uksouth'

// dummy comment 2
param tags = {
  application: 'workforce-services'
  environment: environmentName
}
