import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;
const roleName = import.meta.env.VITE_APPINSIGHTS_CLOUD_ROLE;

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
