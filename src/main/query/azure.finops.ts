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

  const connectionString = config.azureFinOpsConnectionString;
  if (!connectionString || typeof connectionString !== 'string' || connectionString.trim() === '') {
    console.log('Azure Storage connection string not configured, skipping FinOps query');
    return [];
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient('cmexports');
  const root = 'dailyamortized/daily-amortized-export/';
  const folders = [] as string[];

  for await (const blob of containerClient.listBlobsByHierarchy('/', { prefix: root })) {
    folders.push(blob.name);
  }

  if (folders.length === 0) {
    console.log('No folders found in Azure FinOps container');
    return [];
  }

  const latest = folders.sort().pop();
  const files = [] as any[];

  for await (const blob of containerClient.listBlobsByHierarchy('/', { prefix: latest })) {
    files.push(blob);
  }

  if (files.length === 0) {
    console.log('No files found in latest Azure FinOps folder');
    return [];
  }

  files.sort((a, b) => b.properties.lastModified - a.properties.lastModified);

  const latestFile = files[0];
  if (!latestFile || !latestFile.properties || !latestFile.properties.lastModified) {
    console.log('Latest file missing metadata');
    return [];
  }

  const blobClient = containerClient.getBlobClient(latestFile.name);
  const downloadBlockBlobResponse = await blobClient.download();

  if (!downloadBlockBlobResponse.readableStreamBody) {
    console.log('No readable stream body in blob response');
    return [];
  }

  const csv = parse({ columns: true });
  const client = await pool.connect();

  try {
    await deleteDataFromThisMonth(latestFile.properties.lastModified);
    await pipeline(
      downloadBlockBlobResponse.readableStreamBody,
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

  // Use Date constructor to handle month/year rollover automatically
  const startOfMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
  const startOfNextMonth = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 1);

  const startStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-01`;
  const endStr = `${startOfNextMonth.getFullYear()}-${String(startOfNextMonth.getMonth() + 1).padStart(2, '0')}-01`;

  await pool.query(`DELETE FROM azure.finops WHERE date >= '${startStr}' AND date < '${endStr}'`);
}

function formatDate(date: string) {
  const [month, day, year] = date.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
