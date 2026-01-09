import { describe, it, expect } from 'vitest';
import { createMockDb } from './mock-db';

describe('createMockDb (helpers)', () => {
  it('should create an in-memory database', () => {
    const { db, sqlite } = createMockDb();
    
    expect(db).toBeDefined();
    expect(sqlite).toBeDefined();
    
    // Cleanup
    sqlite.close();
  });

  it('should apply migrations successfully', () => {
    const { db, sqlite } = createMockDb();
    
    // If migrations fail, createMockDb throws an error
    // So if we get here, migrations were successful
    expect(db).toBeDefined();
    
    // Cleanup
    sqlite.close();
  });

  it('should create isolated database instances', () => {
    const { db: db1, sqlite: sqlite1 } = createMockDb();
    const { db: db2, sqlite: sqlite2 } = createMockDb();
    
    // Each instance should be independent
    expect(db1).not.toBe(db2);
    expect(sqlite1).not.toBe(sqlite2);
    
    // Cleanup
    sqlite1.close();
    sqlite2.close();
  });
});
