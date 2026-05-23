import { QueueServiceClient } from '@azure/storage-queue';

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING ?? '';
const QUEUE_NAME = process.env.FINALIZE_MATCH_QUEUE_NAME ?? 'finalize-match-queue';

let _serviceClient: QueueServiceClient | null = null;

function getServiceClient(): QueueServiceClient {
  if (!CONNECTION_STRING) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  }
  if (!_serviceClient) {
    _serviceClient = QueueServiceClient.fromConnectionString(CONNECTION_STRING);
  }
  return _serviceClient;
}

export function isQueueConfigured(): boolean {
  return !!CONNECTION_STRING;
}

export async function enqueueFinalizeMatch(
  matchId: number,
  team1Score: number,
  team2Score: number
): Promise<void> {
  const queueClient = getServiceClient().getQueueClient(QUEUE_NAME);
  // Ensure queue exists (no-op if already created)
  await queueClient.createIfNotExists();
  // Azure Storage Queue requires base64-encoded message content
  const payload = JSON.stringify({ matchId, team1Score, team2Score });
  const encoded = Buffer.from(payload).toString('base64');
  await queueClient.sendMessage(encoded);
}
