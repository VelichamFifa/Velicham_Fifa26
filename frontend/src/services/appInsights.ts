import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const fallbackConnectionString =
  'InstrumentationKey=InstrumentationKey=9675ba98-99f5-4244-922f-5775c203e74d;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/;ApplicationId=c146dcdc-902e-4061-911b-43748d1199d6';
const fallbackRoleName = 'fifa26-frontend-qa';

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
