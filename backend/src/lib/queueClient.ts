import { QueueServiceClient } from '@azure/storage-queue';
import { DefaultAzureCredential } from '@azure/identity';

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING ?? '';
const STORAGE_ACCOUNT_URL = process.env.AZURE_STORAGE_ACCOUNT_URL ?? '';
const STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME ?? '';
const AUTH_MODE = (process.env.AZURE_STORAGE_AUTH_MODE ?? '').trim().toLowerCase();
const QUEUE_NAME = process.env.FINALIZE_MATCH_QUEUE_NAME ?? 'finalize-match-queue';

let _serviceClient: QueueServiceClient | null = null;

function getAccountUrl(): string {
  if (STORAGE_ACCOUNT_URL) {
    return STORAGE_ACCOUNT_URL.replace(/\/+$/, '');
  }
  if (STORAGE_ACCOUNT_NAME) {
    return `https://${STORAGE_ACCOUNT_NAME}.queue.core.windows.net`;
  }
  return '';
}

function shouldUseManagedIdentity(): boolean {
  if (AUTH_MODE === 'managedidentity' || AUTH_MODE === 'identity' || AUTH_MODE === 'aad') {
    return true;
  }
  return !!getAccountUrl();
}

function getServiceClient(): QueueServiceClient {
  if (!_serviceClient) {
    if (shouldUseManagedIdentity()) {
      const accountUrl = getAccountUrl();
      if (!accountUrl) {
        throw new Error(
          'Managed identity queue auth requires AZURE_STORAGE_ACCOUNT_URL or AZURE_STORAGE_ACCOUNT_NAME'
        );
      }
      _serviceClient = new QueueServiceClient(accountUrl, new DefaultAzureCredential());
    } else if (CONNECTION_STRING) {
      _serviceClient = QueueServiceClient.fromConnectionString(CONNECTION_STRING);
    } else {
      throw new Error(
        'Queue is not configured. Set AZURE_STORAGE_ACCOUNT_URL (preferred) or AZURE_STORAGE_CONNECTION_STRING'
      );
    }
  }
  return _serviceClient;
}

export function isQueueConfigured(): boolean {
  return !!CONNECTION_STRING || !!getAccountUrl();
}

export async function enqueueFinalizeMatch(
  matchId: number,
  team1Score: number,
  team2Score: number,
  penaltyShootoutWinner?: string
): Promise<void> {
  const queueClient = getServiceClient().getQueueClient(QUEUE_NAME);
  // Ensure queue exists (no-op if already created)
  await queueClient.createIfNotExists();
  // Azure Storage Queue requires base64-encoded message content
  const payload = JSON.stringify({ matchId, team1Score, team2Score, penaltyShootoutWinner });
  const encoded = Buffer.from(payload).toString('base64');
  //log the encoded queue message for debugging (will be decoded by the function)
  console.log(`Enqueuing message to ${QUEUE_NAME}: ${encoded}`);
  // Send the message to the queue
  
  await queueClient.sendMessage(encoded);
}
