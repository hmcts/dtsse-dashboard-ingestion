const specialCases: Record<string, string> = {
  'java-logging': 'platform',
  'attic-cmc-legal-integration-tests': 'cmc',
  'reform-api-standards': 'platform',
  'restful-api-standards': 'dtsse',
  'expressjs-template': 'platform',
  'send-letter-client': 'bsp',
  'send-letter-performance-tests': 'bsp',
  'scheduling-and-listing-poc': 'snl',
  'ccd-definition-processor': 'community',
  'build-failure-analyzer-plugin': 'platform',
  'befta-fw': 'ccd',
  'ccd-client': 'community',
  'ccd-case-ui-toolkit': 'xui',
  'ccd-case-document-utilities': 'am',
  'ccd-cache-warm-performance': 'perftest',
  'ccd-case-migration-template': 'community',
  'ccd-cdm-performance': 'perftest',
  'ccd-docker-definition-importer': 'community',
  'ccd-docker-user-profile-importer': 'community',
  'ccd-elastic-search': 'platform',
  'template-spring-boot': 'platform',
  'template-product-infrastructure': 'platform',
  'template-expressjs': 'platform',
  'template-java-client': 'platform',
  'slack-help-bot': 'platform',
  'life-events-client': 'probate',
  'arch-case-access-reference-implementation': 'am',
  'dts-pre-rec-evidence-poc': 'pre',
  'golden-path-java': 'platform',
  'golden-path-nodejs': 'platform',
  'old-employment-tribunals-shared-infrastructure': 'et',
  'civil-performance': 'performance',
  'civil-sdt-refresh': 'civil-sdt',
  'civil-enforcement-prototype': 'enforcement',
  'civil-sdt': 'civil-sdt',
  'civil-sdt-refresh-3rd-party': 'civil-sdt',
  'civil-sdt-commissioning': 'civil-sdt',
  'civil-breathing-space-proto': 'n/a',
  'civil-sdt-gateway': 'civil-sdt',
  'et-full-system-servers': 'et-pet',
  'et-fake-ccd': 'et-pet',
  'et-data-model-test': 'et-pet',
  'et-atos-file-transfer': 'et-pet',
  'et-admin': 'et-pet',
  'et-ccd-export': 'et-pet',
  'et-ccd-client-ruby': 'et-pet',
  'et-azure-insights': 'et-pet',
  'et-full-system': 'et-pet',
  'et-api': 'et-pet',
  et1: 'et-pet',
  et3: 'et-pet',
  et_gds_design_system: 'et-pet',
  et_test_helpers: 'et-pet',
  et_full_system_gem: 'et-pet',
  et_exporter_gem: 'et-pet',
};

export const getTeamName = (repository: string) => {
  return specialCases[repository] || repository.split('-')[0].toLowerCase();
};
