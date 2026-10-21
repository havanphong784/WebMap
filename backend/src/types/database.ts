import type { PoolClient, QueryResult, QueryResultRow } from 'pg';

export type DbClient = PoolClient;

export interface QueryRunner {
  query<R extends QueryResultRow = QueryResultRow, I extends unknown[] = unknown[]>(
    queryText: string,
    values?: I,
  ): Promise<QueryResult<R>>;
}

export interface DatabaseConfig {
  connectionString?: string;
  ssl?: {
    rejectUnauthorized?: boolean;
    ca?: string[];
  };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}
