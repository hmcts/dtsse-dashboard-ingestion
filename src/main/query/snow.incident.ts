import { promisify } from 'util';

const sn = require('servicenow-rest-api');
const ServiceNow = new sn('mojcppprod', process.env.SNOW_USERNAME, process.env.SNOW_PASSWORD);
const getIncidents = promisify(ServiceNow.getTableData.bind(ServiceNow));
const fields = ['number', 'short_description', 'assignment_group', 'assigned_to', 'impact', 'urgency', 'priority'];
const filters = [
  // 'priority=1',
  // 'state=In Progress',
  'opened_atONLast 6 months@javascript:gs.beginningOfLast6Months()@javascript:gs.endOfLast6Months()', //Opened on last 6 months
];

const teams = {
  'DTS IT ServiceDesk': null,
  'CP AMS': null,
  'DTS Platform Operations Team': 'platform',
  'DTS APM Alerts Triage': null,
  'Reform CMC Delivery Team': 'cmc',
  'Reform SSCS Delivery Team': 'sscs',
  'Reform Probate Delivery Team': 'probate',
  'Judicial Digital Services': null,
  'eJust 2nd Line': null,
  'Crime ITs 2nd Line': null,
  'Reform Immigration and Asylum Delivery Team': 'ia',
  'S&L Project Support': 'snl',
  'Crown IT 2nd Line': null,
  'CP IdAM PET': 'idam',
  'OPTIC Product Support': null,
  'HMCTS O365 2nd Line': null,
  'Digital Print Service Support Team': 'bsp',
  'Template Management': 'platform',
  'CVP 2nd Line': null,
  'Reform SecOps Team': null,
  'CFT Level 2 Support': null,
  'CFT ECM Team': 'ecm',
  'CP Third Line Support': null,
  'DTS No Fault Divorce Support Team': 'nfdiv',
  'Reform Private Law Delivery': 'prl',
  'ServiceNow Support': null,
  'CFT RPA Delivery Team': 'em',
  'Damages PET Team': 'civil',
  SopraSteria: '',
  'CE-File 1st Line Business Support': '',
  'DTS Family Public Law Support Team': 'fprl',
  'CFT MOJ Legacy apps support team': null,
  'Atlassian Support': null,
  'Reform VH Delivery Team': 'vh',
  'DTS Divorce Support Team': 'div',
  'DTS CFT Managed Payments Support Team': 'fees-and-pay',
  'DTS Telephony Product Team': null,
  'DTS CE-File 2nd Line': null,
  'eJust Account Provisioning': null,
  'DTS Evidence Management Support Team': 'em',
  'Digital Scanning Service Support Team': 'bsp',
  'Third Party - Exela': 'bsp',
  'Reform Expert UI Delivery Team': 'xui',
  'Third Party - FourNet ': null,
  'MOJ Incident Team': null,
  'DTS CCD PET Team': 'ccd',
  'APM Support Team': null,
  'DTS Financial Remedy Support Team': 'finrem',
  'DTS CFT Fee and Payments Support Team': 'fees-and-pay',
  'DTS CFT IdAM Support Team': 'idam',
  'DTS PCQ Support Team': 'pcq',
  'CFT BAU support': null,
  'CFT SSCS PET Team': 'sscs',
  'CP EMS': null,
  'DTS Log and Audit Support Team': 'lau',
  'DTS CFT AM Support Team': 'am',
  'DTS FaCT Support Team': 'fact',
  'CFT HWF PET Team': 'hwf',
  'Reform Public Beta Incident Response': null,
  'Third Party – 8x8': null,
  'CP ROTA PET': null,
  'CFT ET PET Team': 'et',
};

export const run = async () => {
  const results = await getIncidents(fields, filters, 'incident');
  console.log(results);

  return [];
};
