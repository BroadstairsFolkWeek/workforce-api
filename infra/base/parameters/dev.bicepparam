using '../base.bicep'

param resourceUniqueNameElement = readEnvironmentVariable('RESOURCE_SUFFIX')

param environmentName = 'dev'
  
param location = 'uksouth'

// dummy comment
param tags = {
  application: 'workforce-services'
  environment: environmentName
}
