// import { config } from './config';
// import * as applicationInsights from 'applicationinsights';
// import { query } from './github';
//
// applicationInsights.setup(config.appinsightsKey).start();
//
// query(`
// {
//     search(query: "org:hmcts", type: REPOSITORY, first: 50%after) {
//         pageInfo {
//             startCursor
//             hasNextPage
//             endCursor
//         }
//         edges {
//             node {
//                 ... on Repository {
//                     name
//                     isArchived
//                     dependabotv1: object(expression: "master:.dependabot/config.yml") {
//                         ... on Blob {
//                             abbreviatedOid
//                         }
//                     }
//                     dependabotv2: object(expression: "master:.github/dependabot.yml") {
//                         ... on Blob {
//                             abbreviatedOid
//                         }
//                     }
//                     renovate: object(expression: "master:.github/renovate.json") {
//                         ... on Blob {
//                             abbreviatedOid
//                         }
//                     }
//                     dependabotv1main: object(expression: "main:.dependabot/config.yml") {
//                         ... on Blob {
//                             abbreviatedOid
//                         }
//                     }
//                     dependabotv2main: object(expression: "main:.github/dependabot.yml") {
//                         ... on Blob {
//                             abbreviatedOid
//                         }
//                     }
//                     renovatemain: object(expression: "main:.github/renovate.json") {
//                         ... on Blob {
//                             abbreviatedOid
//                         }
//                     }
//                 }
//             }
//         }
//     }
// }`)
//   .then(result => console.log(result));

export const sum = (a: number, b: number) => a + b;
