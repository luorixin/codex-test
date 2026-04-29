import { httpClient } from '@/src/api/client';
import type { CatalogSnapshotDto } from '@/src/types/domain';

export async function getCatalogSnapshotFromApi(): Promise<CatalogSnapshotDto> {
  return httpClient.get<CatalogSnapshotDto>('/catalog/snapshot');
}
