import { config } from './config';
import * as applicationInsights from 'applicationinsights';
import { openPullRequestsQuery } from './query/open-pull-requests';
import { longOpenPullRequestsQuery } from './query/long-open-pull-requests';

applicationInsights.setup(config.appinsightsKey).start();

Promise.all([openPullRequestsQuery(), longOpenPullRequestsQuery()]).catch(console.error);
