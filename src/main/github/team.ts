export const getTeamName = (repository: string) => {
  switch (repository) {
    case 'java-logging':
      return 'platform';
    case 'attic-cmc-legal-integration-tests':
      return 'cmc';
    case 'reform-api-standards':
      return 'platform';
    case 'restful-api-standards':
      return 'dtsse';
    case 'expressjs-template':
      return 'platform';
    case 'send-letter-client':
      return 'bsp';
    case 'send-letter-performance-tests':
      return 'bsp';
    case 'scheduling-and-listing-poc':
      return 'snl';
    case 'ccd-definition-processor':
      return 'community';
    case 'build-failure-analyzer-plugin':
      return 'platform';
    case 'befta-fw':
      return 'ccd';
    case 'ccd-client':
      return 'community';
    case 'ccd-case-ui-toolkit':
      return 'xui';
    case 'ccd-case-document-am-api':
      return 'am';
    case 'ccd-case-document-utilities':
      return 'am';
    case 'case-document-metadata-migration':
      return 'am';
    case 'ccd-case-document-am-client':
      return 'am';
    case 'template-spring-boot':
      return 'platform';
    case 'template-product-infrastructure':
      return 'platform';
    case 'template-expressjs':
      return 'platform';
    case 'template-java-client':
      return 'platform';
    case 'slack-help-bot':
      return 'platform';
    case 'life-events-client':
      return 'probate';
    case 'arch-case-access-reference-implementation':
      return 'am';
    case 'dts-pre-rec-evidence-poc':
      return 'pre';
    case 'golden-path-java':
      return 'platform';
    case 'golden-path-nodejs':
      return 'platform';
    case 'old-employment-tribunals-shared-infrastructure':
      return 'et';

    default:
      return repository.split('-')[0].toLowerCase();
  }
};
