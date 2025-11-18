import { BlobServiceClient } from '@azure/storage-blob';
import { config } from '../config';
import { parse } from 'csv-parse';
import { pool } from '../db/store';
import { from as copyFrom } from 'pg-copy-streams';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { stringify } from 'csv-stringify/sync';

export const run = async () => {
  if (new Date().getHours() !== 7 && new Date().getMinutes() < 15) {
    return [];
  }
  
  if (!config.azureFinOpsConnectionString) {
    console.log('Azure Storage connection string not found, skipping FinOps query');
    return []; // Return empty array to avoid breaking the pipeline
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureFinOpsConnectionString);
  const containerClient = blobServiceClient.getContainerClient('cmexports');
  const root = 'dailyamortized/daily-amortized-export/';
  const folders = [] as string[];

  for await (const blob of containerClient.listBlobsByHierarchy('/', { prefix: root })) {
    folders.push(blob.name);
  }

  const latest = folders.sort().pop();
  const files = [] as any[];

  for await (const blob of containerClient.listBlobsByHierarchy('/', { prefix: latest })) {
    files.push(blob);
  }

  files.sort((a, b) => b.properties.lastModified - a.properties.lastModified);

  const latestFile = files[0];
  const blobClient = containerClient.getBlobClient(latestFile.name);
  const downloadBlockBlobResponse = await blobClient.download();
  const csv = parse({ columns: true });
  const client = await pool.connect();

  try {
    await deleteDataFromThisMonth(latestFile.properties.lastModified);
    await pipeline(
      downloadBlockBlobResponse.readableStreamBody!,
      csv,
      transform,
      client.query(
        copyFrom(
          "COPY azure.finops (subscription_id, subscription_name, resource_group, resource_name, date, product_name, cost_in_billing_currency, meter_category, meter_sub_category, meter_name, consumed_service, tags, built_from) FROM STDIN WITH CSV DELIMITER E'\\t' QUOTE E'\\b' ESCAPE E'\\b' HEADER;"
        )
      )
    );
  } catch (err) {
    console.error('Error writing to database', err);
  } finally {
    client.release();
  }

  return [];
};

const transform = new Transform({
  objectMode: true,
  transform(row, encoding, callback) {
    if (row.AccountName === 'DTS' && row.CostInBillingCurrency > 0) {
      try {
        this.push(rowToString(row));
      } catch (e) {
        console.error(e);
      }
    }
    callback();
  },
});

function rowToString(row: any) {
  const tags = row.Tags.toLowerCase().replaceAll(' ', '').replaceAll('"', '').split(',');

  const builtFromTag =
    tags
      .find((tag: string) => tag.includes('builtfrom:'))
      ?.replace('builtfrom:', '')
      .replace('.git', '') || null;

  const builtFrom =
    builtFromTag === null || builtFromTag.startsWith('https://github.com/hmcts')
      ? builtFromTag
      : builtFromTag.startsWith('hmcts/')
      ? 'https://github.com/' + builtFromTag
      : 'https://github.com/hmcts/' + builtFromTag;

  const data = {
    subscription_id: row.SubscriptionId,
    subscription_name: row.SubscriptionName,
    resource_group: row.ResourceGroup,
    resource_name: row.ResourceName,
    date: formatDate(row.Date),
    product_name: row.ProductName,
    cost_in_billing_currency: row.CostInBillingCurrency,
    meter_category: row.MeterCategory,
    meter_sub_category: row.MeterSubCategory,
    meter_name: row.MeterName,
    consumed_service: row.ConsumedService.toLowerCase(),
    tags: row.Tags.replaceAll('"', "'"),
    built_from: builtFrom,
  };

  return stringify([Object.values(data)], { delimiter: '\t' });
}

async function deleteDataFromThisMonth(date: string) {
  const latestDate = new Date(date);
  // delete rows where date is inside the same month as the latest file as each file contains the month to - today's date
  await pool.query(
    `DELETE FROM azure.finops WHERE date >= '${latestDate.getFullYear()}-${latestDate.getMonth() + 1}-01' AND date < '${latestDate.getFullYear()}-${
      latestDate.getMonth() + 2
    }-01'`
  );
}

function formatDate(date: string) {
  const [month, day, year] = date.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
