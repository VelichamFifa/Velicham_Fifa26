/** Map numeric PK to Mongo-style `_id` string for API compatibility with the frontend. */
export function withMongoId<T extends { id: number }>(
  row: T
): Omit<T, 'id'> & { _id: string } {
  const { id, ...rest } = row;
  return { ...rest, _id: String(id) } as Omit<T, 'id'> & { _id: string };
}

export function withMongoIds<T extends { id: number }>(rows: T[]): Array<Omit<T, 'id'> & { _id: string }> {
  return rows.map(withMongoId);
}
