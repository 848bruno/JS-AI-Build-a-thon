// Add these parameters (if missing)
param aoaiResourceName string = 'lang-memory-resource'  // Unique name
param aoaiDeploymentName string = 'gpt-4o'
param aoaiModelName string = 'gpt-4o'
param aoaiModelVersion string = '2024-05-13'
param location string = resourceGroup().location
param tags object = {} // Add this line to define tags as an empty object by default

// Add this resource (will skip if already exists)

// Deploy OpenAI only if not already present
resource aoaiAccountDeploy 'Microsoft.CognitiveServices/accounts@2023-05-01' = if (!contains(resourceGroup().tags, 'aoai-deployed')) {
  name: aoaiResourceName
  location: location
  kind: 'OpenAI'
  sku: { name: 'S0' }
  properties: { customSubDomainName: aoaiResourceName }
  tags: union(tags, { 'aoai-deployed': 'true' })  // Tag to track deployment
}

resource aoaiModelDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = if (!contains(resourceGroup().tags, 'aoai-deployed')) {
  name: aoaiDeploymentName
  parent: aoaiAccountDeploy
  properties: {
    model: {
      format: 'OpenAI'
      name: aoaiModelName
      version: aoaiModelVersion
    }
  }
}
