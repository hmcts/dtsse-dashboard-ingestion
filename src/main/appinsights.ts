import { config } from './config';
import * as applicationInsights from 'applicationinsights';

applicationInsights.setup(config.appinsightsKey).start();

export function store(name: string, properties: Record<string, unknown>): void {
  applicationInsights.defaultClient.trackEvent({ name, properties });
}
