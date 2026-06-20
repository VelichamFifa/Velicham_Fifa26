import * as appInsights from 'applicationinsights';
import { logger } from '../lib/logger';

const connectionString =
  process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
  process.env.APPINSIGHTS_CONNECTION_STRING ||
  (process.env.APPINSIGHTS_INSTRUMENTATIONKEY
    ? `InstrumentationKey=${process.env.APPINSIGHTS_INSTRUMENTATIONKEY}`
    : '');

const cloudRole = process.env.APPINSIGHTS_CLOUD_ROLE || process.env.WEBSITE_SITE_NAME;

if (connectionString && connectionString.trim().length > 0) {
  appInsights
    .setup(connectionString)
    .setAutoCollectConsole(true, true)
    .setAutoCollectDependencies(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectRequests(true)
    .setAutoDependencyCorrelation(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .setUseDiskRetryCaching(true)
    .start();

  const client = appInsights.defaultClient;
  if (client && cloudRole && cloudRole.trim().length > 0) {
    client.context.tags[client.context.keys.cloudRole] = cloudRole;
  }

  logger.info('appInsights', 'Application Insights backend telemetry enabled', {
    cloudRole: cloudRole || 'default',
  });
} else {
  logger.warn('appInsights', 'Application Insights disabled. Missing connection string.', {
    expectedEnv:
      'APPLICATIONINSIGHTS_CONNECTION_STRING or APPINSIGHTS_CONNECTION_STRING or APPINSIGHTS_INSTRUMENTATIONKEY',
  });
}

export default appInsights;