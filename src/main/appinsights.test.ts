import { describe, expect, jest, test, afterAll } from '@jest/globals';
import { MockedObject } from 'jest-mock';
import * as applicationInsights from 'applicationinsights';

jest.mock('./config', () => ({ config: { appinsightsKey: 'test' } }));
jest.mock('applicationinsights');

const mock = applicationInsights as MockedObject<typeof applicationInsights>;
mock.setup.mockReturnThis();
mock.start.mockReturnThis();
mock.defaultClient = { trackEvent: jest.fn() } as unknown as MockedObject<applicationInsights.TelemetryClient>;

import { store } from './appinsights';

describe('application insights client', () => {
  test('sets config', () => {
    expect(mock.setup).toHaveBeenCalledWith('test');
    expect(mock.start).toHaveBeenCalled();
  });

  test('tracks event', () => {
    store('test', { value: 'test' });

    expect(mock.defaultClient.trackEvent).toHaveBeenCalledWith({ name: 'test', properties: { value: 'test' } });
  });
});
