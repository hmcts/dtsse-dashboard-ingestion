import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

export const run = async () => {
  const account = 'finopsdataptlsa';
  const defaultAzureCredential = new DefaultAzureCredential();

  const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net`, defaultAzureCredential);

  console.log(await blobServiceClient.getProperties());
  const containers = blobServiceClient.listContainers();

  for await (const container of containers) {
    console.log(container);
  }

  return [];
};
