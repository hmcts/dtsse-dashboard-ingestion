const sn = require('servicenow-rest-api');
const ServiceNow = new sn('mojcppprod', process.env.SNOW_USERNAME, process.env.SNOW_PASSWORD);

const fields = ['number', 'short_description', 'assignment_group', 'assigned_to'];

const filters = [
  // 'priority=1',
  // 'state=In Progress',
  'opened_atONLast 6 months@javascript:gs.beginningOfLast6Months()@javascript:gs.endOfLast6Months()', //Opened on last 6 months
];

export const run = async () => {
  // await new Promise(r => ServiceNow.Authenticate((res: any) => {
  //   console.log(res);
  //   r(res);
  // }));
  console.log('Running queries');
  await new Promise(r =>
    ServiceNow.getTableData(fields, filters, 'incident', (res: any) => {
      console.log(res);
      r(res);
    })
  );
  await new Promise(r =>
    ServiceNow.getSampleData('change_request', (res: any) => {
      //
      console.log(res);
      r(res);
    })
  );

  return [];
};
