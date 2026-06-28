import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const fallbackConnectionString =
  'InstrumentationKey=5380ebe0-70e2-4c97-b316-f8e33efd14cb;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=026d37a6-bbf8-4d99-a963-5bff9799d447';
const fallbackRoleName = 'fifa26-frontend-prod';

const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING || fallbackConnectionString;
const roleName = import.meta.env.VITE_APPINSIGHTS_CLOUD_ROLE || fallbackRoleName;

const appInsights =
  connectionString && connectionString.trim().length > 0
    ? new ApplicationInsights({
        config: {
          connectionString,
          disableFetchTracking: false,
          enableAutoRouteTracking: false,
        },
      })
    : null;

if (appInsights) {
  appInsights.loadAppInsights();

  if (roleName && roleName.trim().length > 0) {
    appInsights.addTelemetryInitializer((envelope) => {
      envelope.tags = envelope.tags || [];
      envelope.tags['ai.cloud.role'] = roleName;
    });
  }
}

export function trackPageView(name: string, uri: string): void {
  appInsights?.trackPageView({ name, uri });
}

export function trackException(error: Error, severityLevel?: number): void {
  appInsights?.trackException({ exception: error, severityLevel });
}

export function trackEvent(name: string, properties?: Record<string, string>): void {
  appInsights?.trackEvent({ name }, properties);
}

export { appInsights };
