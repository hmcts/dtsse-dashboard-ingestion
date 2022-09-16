// import { config } from './config';
// import * as applicationInsights from 'applicationinsights';
// import { query } from './github';
//
// applicationInsights.setup(config.appinsightsKey).start();
//
// query('query { search(query: "org:hmcts is:pr is:open", type: ISSUE, first: 100) { pageInfo { endCursor hasNextPage } edges { node { ... on PullRequest { title url createdAt author { login } } } } } }')
//   .then(result => console.log(result));

export const sum = (a: number, b: number) => a + b;
