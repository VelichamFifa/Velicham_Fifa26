# Azure Deployment Guide

## Prerequisites

- Azure Subscription
- Azure CLI installed
- GitHub account with the repository
- Node.js 18+ installed locally

## Manual Deployment Steps

### 1. Create Azure Resources

```bash
# Login to Azure
az login

# Create a resource group
az group create \
  --name fifa26-rg \
  --location eastus

# Create App Service Plan (Linux)
az appservice plan create \
  --name fifa26-plan \
  --resource-group fifa26-rg \
  --sku B1 \
  --is-linux

# Create Backend App Service
az webapp create \
  --resource-group fifa26-rg \
  --plan fifa26-plan \
  --name fifa26-backend \
  --runtime "NODE|18-lts"

# Create Frontend Static Web App
az staticwebapp create \
  --name fifa26-frontend \
  --resource-group fifa26-rg \
  --source https://github.com/yourusername/fifa26-predictor \
  --location eastus \
  --branch main
```

### 2. Configure Backend Environment Variables

```bash
# Set application settings
az webapp config appsettings set \
  --resource-group fifa26-rg \
  --name fifa26-backend \
  --settings \
    MONGODB_URI="your_mongodb_connection_string" \
    JWT_SECRET="your_jwt_secret_key" \
    JWT_EXPIRE="7d" \
    NODE_ENV="production" \
    FRONTEND_URL="https://fifa26-frontend.azurestaticapps.net" \
    RATE_LIMIT_WINDOW_MS="900000" \
    RATE_LIMIT_MAX_REQUESTS="100"
```

### 3. Deploy Backend

```bash
# Build the backend
cd backend
npm install
npm run build

# Create deployment package
cd dist
zip -r ../backend-deploy.zip .
cd ..

# Deploy to App Service
az webapp deployment source config-zip \
  --resource-group fifa26-rg \
  --name fifa26-backend \
  --src backend-deploy.zip
```

### 4. Deploy Frontend

```bash
# Build the frontend
cd frontend
npm install
npm run build

# The frontend will be automatically deployed to Static Web Apps
# if you've connected the GitHub repository during creation
```

## Automated Deployment with GitHub Actions

### 1. Create GitHub Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

```
AZURE_CREDENTIALS: 
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "subscriptionId": "your-subscription-id",
  "tenantId": "your-tenant-id"
}

AZURE_STATIC_WEB_APPS_API_TOKEN: <token-from-static-web-app>
```

### 2. Create Service Principal

```bash
az ad sp create-for-rbac \
  --name fifa26-deployer \
  --role Contributor \
  --scopes /subscriptions/{subscriptionId}
```

### 3. Push to Deploy

Simply push to the `main` or `develop` branch to trigger automatic deployment:

```bash
git push origin main
```

## Environment Variables Reference

### Backend (.env or Azure App Settings)

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/fifa26predictor
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://fifa26-frontend.azurestaticapps.net
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env.production)

```
VITE_API_URL=https://fifa26-backend-a3b8hgb4ggdzd5ha.eastus-01.azurewebsites.net/api
```

## Database Migration

After deployment, run seeds to populate data:

### Using Azure Portal:

1. Navigate to App Service SSH console
2. Run:
   ```bash
   cd /home/site/wwwroot
   npm run seed:communities
   npm run seed:teams
   npm run seed:matches
   ```

### Using Azure CLI:

```bash
az webapp ssh \
  --resource-group fifa26-rg \
  --name fifa26-backend

# Once connected:
cd /home/site/wwwroot
npm run seed:communities
npm run seed:teams
npm run seed:matches
```

## Monitoring & Logs

### View Application Logs

```bash
# Stream backend logs
az webapp log tail \
  --resource-group fifa26-rg \
  --name fifa26-backend

# View historical logs
az webapp log download \
  --resource-group fifa26-rg \
  --name fifa26-backend
```

### Application Insights

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app fifa26-insights \
  --location eastus \
  --resource-group fifa26-rg
```

## Scaling

### Increase Backend Capacity

```bash
az appservice plan update \
  --name fifa26-plan \
  --resource-group fifa26-rg \
  --sku S1
```

### Static Web Apps Scaling

Static Web Apps automatically scales based on demand.

## Troubleshooting

### Backend not starting

```bash
# Check Application logs
az webapp log tail --resource-group fifa26-rg --name fifa26-backend

# Restart the app
az webapp restart --resource-group fifa26-rg --name fifa26-backend
```

### CORS Issues

Ensure `FRONTEND_URL` is correctly set in backend environment variables.

### Static Web App not updating

- Verify the GitHub action is running successfully
- Check the deployment logs in Azure Portal
- Ensure build command is correct: `npm run build`

## Cleanup

To remove all resources:

```bash
az group delete --name fifa26-rg --yes
```

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [GitHub Actions Azure Integration](https://github.com/Azure/actions)
