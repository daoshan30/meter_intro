declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(filename: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }

  export class StatementSync {
    get(...anonymousParameters: unknown[]): unknown;
    run(...anonymousParameters: unknown[]): { lastInsertRowid: number | bigint; changes: number | bigint };
  }
}
