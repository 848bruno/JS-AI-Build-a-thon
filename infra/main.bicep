targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment used to generate a short unique hash.')
param environmentName string = 'ambale'

@minLength(1)
@description('Primary location for all resources')
param location string = 'eastus2'

param resourceGroupName string = 'rg-ambale'
param webappName string = 'webapp'
param apiServiceName string = 'api'
param appServicePlanName string = ''
param storageAccountName string = ''
param cosmosDbServiceName string = ''

// OpenAI Settings (pre-created)
param openAiInstanceName string = 'ambal-mcgosu1b-swedencentrals'
param openAiUrl string = 'https://ambal-mcgosu1b-swedencentral.openai.azure.com'
param openAiApiVersion string = '2024-04-01-preview'

@description('Location for Static Web App')
@allowed(['westus2', 'centralus', 'eastus2', 'westeurope', 'eastasia', 'eastasiastage'])
param webappLocation string = 'eastus2'

param chatModelName string = 'gpt-4.1'
param chatDeploymentName string = chatModelName
param chatModelVersion string = '2025-04-14'
param chatDeploymentCapacity int = 15
param embeddingsModelName string = 'text-embedding-ada-002'
param embeddingsModelVersion string = '2'
param embeddingsDeploymentName string = embeddingsModelName
param embeddingsDeploymentCapacity int = 30

param blobContainerName string = 'files'

param principalId string = ''
param useVnet bool = false
param isContinuousDeployment bool = false

var abbrs = loadJsonContent('abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 'azd-env-name': environmentName }
var finalOpenAiUrl = openAiUrl
var finalOpenAiName = openAiInstanceName
var storageUrl = 'https://${storage.outputs.name}.blob.${environment().suffixes.storage}'
var apiResourceName = '${abbrs.webSitesFunctions}api-${resourceToken}'

// Resource group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// Web App
module webapp './core/host/staticwebapp.bicep' = {
  name: 'webapp'
  scope: resourceGroup
  params: {
    name: webappName
    location: webappLocation
    tags: union(tags, { 'azd-service-name': webappName })
    sku: useVnet ? {
      name: 'Standard'
      tier: 'Standard'
    } : {
      name: 'Free'
      tier: 'Free'
    }
  }
}

// API
module api './app/api.bicep' = {
  name: 'api'
  scope: resourceGroup
  params: {
    name: apiResourceName
    location: location
    tags: union(tags, { 'azd-service-name': apiServiceName })
    appServicePlanId: appServicePlan.outputs.id
    allowedOrigins: [webapp.outputs.uri]
    storageAccountName: storage.outputs.name
    applicationInsightsName: monitoring.outputs.applicationInsightsName
    virtualNetworkSubnetId: useVnet ? vnet.outputs.appSubnetID : ''
    staticWebAppName: webapp.outputs.name
    appSettings: {
      APPINSIGHTS_INSTRUMENTATIONKEY: monitoring.outputs.applicationInsightsInstrumentationKey
      AZURE_OPENAI_API_INSTANCE_NAME: finalOpenAiName
      AZURE_OPENAI_API_ENDPOINT: finalOpenAiUrl
      AZURE_OPENAI_API_VERSION: openAiApiVersion
      AZURE_OPENAI_API_DEPLOYMENT_NAME: chatDeploymentName
      AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME: embeddingsDeploymentName
      AZURE_COSMOSDB_NOSQL_ENDPOINT: cosmosDb.outputs.endpoint
      AZURE_STORAGE_URL: storageUrl
      AZURE_STORAGE_CONTAINER_NAME: blobContainerName
    }
  }
}

// App Service Plan
module appServicePlan './core/host/appserviceplan.bicep' = {
  name: 'appserviceplan'
  scope: resourceGroup
  params: {
    name: appServicePlanName != '' ? appServicePlanName : '${abbrs.webServerFarms}${resourceToken}'
    location: location
    tags: tags
    sku: useVnet ? {
      name: 'FC1'
      tier: 'FlexConsumption'
    } : {
      name: 'Y1'
      tier: 'Dynamic'
    }
    reserved: useVnet ? true : null
  }
}

// Storage
module storage './core/storage/storage-account.bicep' = {
  name: 'storage'
  scope: resourceGroup
  params: {
    name: storageAccountName != '' ? storageAccountName : '${abbrs.storageStorageAccounts}${resourceToken}'
    location: location
    tags: tags
    allowBlobPublicAccess: false
    allowSharedKeyAccess: !useVnet
    containers: concat([
      {
        name: blobContainerName
        publicAccess: 'None'
      }
    ], useVnet ? [
      {
        name: apiResourceName
      }
    ] : [])
    networkAcls: useVnet ? {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: [
        {
          id: vnet.outputs.appSubnetID
          action: 'Allow'
        }
      ]
    } : {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

// VNet (optional)
module vnet './app/vnet.bicep' = if (useVnet) {
  name: 'vnet'
  scope: resourceGroup
  params: {
    name: '${abbrs.networkVirtualNetworks}${resourceToken}'
    location: location
    tags: tags
  }
}

// Monitoring
module monitoring './core/monitor/monitoring.bicep' = {
  name: 'monitoring'
  scope: resourceGroup
  params: {
    location: location
    tags: tags
    logAnalyticsName: '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: '${abbrs.insightsComponents}${resourceToken}'
    applicationInsightsDashboardName: '${abbrs.portalDashboards}${resourceToken}'
  }
}

// Cosmos DB
module cosmosDb 'br/public:avm/res/document-db/database-account:0.9.0' = {
  name: 'cosmosDb'
  scope: resourceGroup
  params: {
    name: cosmosDbServiceName != '' ? cosmosDbServiceName : '${abbrs.documentDBDatabaseAccounts}${resourceToken}'
    tags: tags
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    managedIdentities: {
      systemAssigned: true
    }
    capabilitiesToAdd: [
      'EnableServerless'
      'EnableNoSQLVectorSearch'
    ]
    networkRestrictions: {
      ipRules: []
      virtualNetworkRules: []
      publicNetworkAccess: 'Enabled'
    }
    sqlDatabases: [
      {
        containers: [
          { name: 'vectorSearchContainer', paths: ['/id'] }
        ]
        name: 'vectorSearchDB'
      }
      {
        containers: [
          { name: 'chatHistoryContainer', paths: ['/userId'] }
        ]
        name: 'chatHistoryDB'
      }
    ]
  }
}

// OUTPUTS
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = resourceGroup.name

output AZURE_OPENAI_API_INSTANCE_NAME string = finalOpenAiName
output AZURE_OPENAI_API_ENDPOINT string = finalOpenAiUrl
output AZURE_OPENAI_API_VERSION string = openAiApiVersion
output AZURE_OPENAI_API_DEPLOYMENT_NAME string = chatDeploymentName
output AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME string = embeddingsDeploymentName
output AZURE_STORAGE_URL string = storageUrl
output AZURE_STORAGE_CONTAINER_NAME string = blobContainerName
output AZURE_COSMOSDB_NOSQL_ENDPOINT string = cosmosDb.outputs.endpoint
output API_URL string = useVnet ? '' : api.outputs.uri
output WEBAPP_URL string = webapp.outputs.uri
output UPLOAD_URL string = useVnet ? webapp.outputs.uri : api.outputs.uri
