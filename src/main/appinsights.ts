import { config } from './config';
import * as applicationInsights from 'applicationinsights';

applicationInsights.setup(config.appinsightsKey).start();

export function store(name: string, results: Record<string, unknown>[]): void {
  for (const properties of results) {
    applicationInsights.defaultClient.trackEvent({ name, properties });
  }
}
