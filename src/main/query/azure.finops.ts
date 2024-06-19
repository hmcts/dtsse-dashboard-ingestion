import { BlobServiceClient } from '@azure/storage-blob';
import { config } from '../config';

export const run = async () => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(config.azureFinOpsConnectionString);

  for await (const container of blobServiceClient.listContainers()) {
    console.log(`Container: ${container.name}`);
  }

  return [];
};
