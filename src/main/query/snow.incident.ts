import axios, { AxiosRequestConfig } from 'axios';
import { config } from '../config';

const teams: Record<string, string | null> = {
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
  SopraSteria: null,
  'CE-File 1st Line Business Support': null,
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

const fields = [
  'number',
  'short_description',
  'assignment_group',
  'assigned_to',
  'impact',
  'urgency',
  'priority',
  'sys_created_on',
  'sys_updated_on',
  'closed_at',
  'state',
].join(',');
// const filters = ['GOTOsys_updated_on>=javascript:gs.beginningOfLast30Days()'].join('^');
const filters = ['sys_updated_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()'].join('^');
const url = `https://mojcppprod.service-now.com/api/now/v2/table/incident?sysparm_display_value=true&sysparm_fields=${fields}&sysparm_query=${filters}`;

export const run = async () => {
  const response = await axios({
    url: url,
    method: 'get',
    auth: {
      username: config.snowUsername,
      password: config.snowPassword,
    },
  } as AxiosRequestConfig);

  if (!response.data?.result) {
    console.log('No incidents found');
    console.log(response.data);
  }

  return response.data?.result?.map((incident: any) => ({
    id: incident.number,
    title: incident.short_description,
    team: teams[incident.assignment_group.display_value],
    assignee: incident.assigned_to.display_value,
    impact: incident.impact,
    urgency: incident.urgency,
    priority: incident.priority,
    state: incident.state,
    created: formatDate(incident.sys_created_on),
    updated: formatDate(incident.sys_updated_on),
    closed: incident.closed_at ? formatDate(incident.closed_at) : null,
  }));
};

const formatDate = (date: string) => {
  const [day, month, year] = date.split(' ')[0].split('-');
  return `${year}-${month}-${day} ${date.split(' ')[1]}`;
};
