import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createMockDb } from '../../helpers/mock-db';
import { server } from '../../mocks/server';
import { artists, posts, settings, SETTINGS_ID } from '@/main/db/schema';
import { eq } from 'drizzle-orm';
import { getProvider } from '@/main/providers';
import type { BooruPost } from '@/main/providers/types';
import { PAGE_SIZE } from '@/main/providers/types';
import { ProviderSearchError } from '@/main/providers/provider-search-errors';
import { IPC_CHANNELS } from '@/main/ipc/channels';

// Mock Electron BEFORE imports
vi.mock('electron', () => ({
  app: { getPath: () => '/tmp' },
  safeStorage: {
    isEncryptionAvailable: () => true,
    decryptString: (_buffer: Buffer) => {
      // Mock decryption - return a test API key
      return 'test-api-key-12345';
    },
    encryptString: (text: string) => {
      // Mock encryption - return base64 encoded string
      return Buffer.from(text).toString('base64');
    },
  },
}));

vi.mock('electron-log', () => ({
  default: { 
    info: vi.fn(), 
    error: vi.fn(), 
    debug: vi.fn(),
    warn: vi.fn(),
    transports: {
      main: { level: false },
      renderer: { level: false },
      console: { 
        level: false,
        format: '',
      },
      file: {
        level: 'info',
        resolvePathFn: vi.fn(),
      },
      ipc: {},
    },
    errorHandler: {
      startCatching: vi.fn(),
    },
  },
}));

// Mock getDb to return our mock database
// We'll set this up in beforeEach
let mockDbInstance: ReturnType<typeof createMockDb>['db'] | null = null;
let mockSqliteInstance: ReturnType<typeof createMockDb>['sqlite'] | null = null;

vi.mock('@/main/db/client', () => ({
  getDb: () => {
    if (!mockDbInstance) {
      throw new Error('Mock DB not set. Call setMockDbInstance() first.');
    }
    return mockDbInstance;
  },
  initializeDatabase: vi.fn(),
  getSqliteInstance: () => {
    if (!mockSqliteInstance) {
      throw new Error('Mock SQLite not set. Call setMockDbInstance() first.');
    }
    return mockSqliteInstance;
  },
  closeDatabase: vi.fn(),
}));

// Import after mocks
import {
  SyncCancelledError,
  SyncService,
  isSyncCancelledError,
} from '@/main/services/sync-service';

describe('SyncService Integration', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let service: SyncService;

  // Start MSW Server
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    // 1. Create fresh in-memory database (:memory: guarantees clean slate)
    mockDb = createMockDb();
    
    // 2. Inject mock DB into getDb() mock
    mockDbInstance = mockDb.db;
    mockSqliteInstance = mockDb.sqlite;

    // 3. Seed DB with settings (required for SyncService)
    await mockDb.db.insert(settings).values({
      id: SETTINGS_ID,
      userId: '12345',
      encryptedApiKey: Buffer.from('test-api-key-12345').toString('base64'),
      isSafeMode: false,
      isAdultConfirmed: true,
      isAdultVerified: true,
    });

    // 4. Seed DB with one artist
    await mockDb.db.insert(artists).values({
      name: 'Test Artist',
      tag: 'artist_name', // Matches tag in fixture
      provider: 'rule34',
      type: 'tag',
      apiEndpoint: 'https://api.rule34.xxx/index.php',
      lastPostId: 0,
      newPostsCount: 0,
    });

    // 5. Reset MSW handlers
    server.resetHandlers();

    // 6. Instantiate service
    service = new SyncService();
  });

  afterEach(() => {
    // Close database connection (only if mockDb was successfully created)
    if (mockDb?.sqlite) {
      try {
        mockDb.sqlite.close();
      } catch (_error) {
        // Ignore errors when closing (database might already be closed)
      }
    }
    // Clear mock DB instance to prevent state leakage
    mockDbInstance = null;
    mockSqliteInstance = null;
    vi.clearAllMocks();
  });

  it('should fetch posts from API and save to database', async () => {
    // Arrange
    // Get the artist we just created
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });
    
    if (!artist) {
      throw new Error('Artist setup failed');
    }

    // Act - Get settings and call syncArtist directly
    // This allows us to test the sync logic without going through repairArtist
    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });
    
    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    // Decrypt API key (mocked safeStorage)
    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    await service.syncArtist(
      artist,
      {
        userId: settingsRecord.userId || '',
        apiKey,
      }
    );

    // Assert 1: Posts are saved (2 posts from fixture)
    const savedPosts = await mockDb.db
      .select()
      .from(posts)
      .where(eq(posts.artistId, artist.id));
    
    expect(savedPosts).toHaveLength(2);
    
    // Assert 2: Check specific fields mapping
    const imagePost = savedPosts.find(p => p.fileUrl.endsWith('.jpg'));
    const videoPost = savedPosts.find(p => p.fileUrl.endsWith('.mp4'));
    
    // Image post (explicit rating)
    expect(imagePost).toBeDefined();
    expect(imagePost?.postId).toBe(1234567);
    expect(imagePost?.rating).toBe('e'); // "explicit" -> "e"
    expect(imagePost?.tags).toContain('tag1');
    expect(imagePost?.tags).toContain('tag2');
    expect(imagePost?.tags).toContain('artist_name');
    
    // Video post (safe rating)
    expect(videoPost).toBeDefined();
    expect(videoPost?.postId).toBe(1234568);
    expect(videoPost?.rating).toBe('s'); // "safe" -> "s"
    expect(videoPost?.tags).toContain('tag3');
    expect(videoPost?.tags).toContain('tag4');
    expect(videoPost?.tags).toContain('artist_name');

    // Assert 3: Artist lastPostId updated to the highest post ID
    const updatedArtist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.id, artist.id),
    });
    
    expect(updatedArtist?.lastPostId).toBe(1234568); // The ID of the newest post in fixture
  });

  it('should rebuild FTS index after initial sync', async () => {
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });

    if (!artist) {
      throw new Error('Artist setup failed');
    }

    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    const createPage = (startId: number): BooruPost[] =>
      Array.from({ length: 100 }, (_, index) => {
        const id = startId + index;
        return {
          id,
          fileUrl: `https://cdn.example.com/${id}.jpg`,
          previewUrl: `https://cdn.example.com/${id}-preview.jpg`,
          sampleUrl: `https://cdn.example.com/${id}-sample.jpg`,
          tags: ['artist_name', `tag_${id}`],
          rating: 's',
          score: 0,
          source: '',
          width: 1000,
          height: 1000,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        };
      });

    const provider = getProvider('rule34');
    const fetchPostsSpy = vi.spyOn(provider, 'fetchPosts').mockImplementation(
      async (_tags, page) => {
        if (page === 0) {
          return createPage(1);
        }
        return [];
      }
    );

    try {
      await service.syncArtist(artist, {
        userId: settingsRecord.userId || '',
        apiKey,
      });

      const savedPosts = await mockDb.db
        .select()
        .from(posts)
        .where(eq(posts.artistId, artist.id));
      expect(savedPosts).toHaveLength(100);

      const ftsRowsForArtist = mockDb.sqlite
        .prepare(`
          SELECT COUNT(*) as count
          FROM posts_fts
          WHERE rowid IN (
            SELECT id FROM posts WHERE artist_id = ?
          )
        `)
        .get(artist.id) as { count: number };
      expect(ftsRowsForArtist.count).toBe(100);
    } finally {
      fetchPostsSpy.mockRestore();
    }
  });

  it('should only fetch new posts when lastPostId is set', async () => {
    // Arrange - First sync to get initial posts
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });
    
    if (!artist) {
      throw new Error('Artist setup failed');
    }

    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });
    
    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    // First sync - get all posts
    await service.syncArtist(artist, {
      userId: settingsRecord.userId || '',
      apiKey,
    });

    // Update artist to have lastPostId = first post ID (simulating incremental sync)
    await mockDb.db
      .update(artists)
      .set({ lastPostId: 1234567 })
      .where(eq(artists.id, artist.id));

    // Clear posts to test incremental sync
    await mockDb.db.delete(posts).where(eq(posts.artistId, artist.id));

    // Act - Sync should only fetch posts with ID > 1234567
    const updatedArtist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.id, artist.id),
    });
    
    if (!updatedArtist) {
      throw new Error('Artist not found');
    }

    await service.syncArtist(updatedArtist, {
      userId: settingsRecord.userId || '',
      apiKey,
    });

    // Assert - Should only get the second post (ID > 1234567)
    const savedPosts = await mockDb.db
      .select()
      .from(posts)
      .where(eq(posts.artistId, artist.id));
    
    // Should only get post with ID 1234568 (the newer one)
    expect(savedPosts).toHaveLength(1);
    expect(savedPosts[0].postId).toBe(1234568);
  });

  it('should handle API errors gracefully', async () => {
    // Arrange - Setup error handler
    const { http, HttpResponse } = await import('msw');
    
    server.use(
      // Override default handler to return error
      http.get('https://api.rule34.xxx/index.php', () => {
        return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      })
    );

    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });
    
    if (!artist) {
      throw new Error('Artist setup failed');
    }

    // Act & Assert - Should not throw, but log error
    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });
    
    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    // Act - HTTP 500 becomes a provider parse/network failure after retries.
    // Cursor must stay put; incomplete flag must be visible (no silent "success" watermark).
    await service.syncArtist(artist, {
      userId: settingsRecord.userId || '',
      apiKey,
    });

    // No posts should be saved
    const savedPosts = await mockDb.db
      .select()
      .from(posts)
      .where(eq(posts.artistId, artist.id));
    
    expect(savedPosts).toHaveLength(0);

    const updatedArtist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.id, artist.id),
    });
    expect(updatedArtist?.lastPostId).toBe(0);
    expect(updatedArtist?.lastSyncIncomplete).toBe(true);
  });

  it('should preserve accumulated posts when a later page fails', async () => {
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });

    if (!artist) {
      throw new Error('Artist setup failed');
    }

    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    const createPage = (startId: number): BooruPost[] =>
      Array.from({ length: 100 }, (_, index) => {
        const id = startId + index;
        return {
          id,
          fileUrl: `https://cdn.example.com/${id}.jpg`,
          previewUrl: `https://cdn.example.com/${id}-preview.jpg`,
          sampleUrl: `https://cdn.example.com/${id}-sample.jpg`,
          tags: ['artist_name', `tag_${id}`],
          rating: 's',
          score: 0,
          source: '',
          width: 1000,
          height: 1000,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        };
      });

    const provider = getProvider('rule34');
    const fetchPostsSpy = vi.spyOn(provider, 'fetchPosts').mockImplementation(
      async (_tags, page) => {
        if (page === 0) {
          return createPage(1);
        }
        if (page === 1) {
          return createPage(101);
        }
        if (page === 2) {
          throw new ProviderSearchError('network', 'Provider page 3 failure');
        }
        return [];
      }
    );

    try {
      await expect(
        service.syncArtist(artist, {
          userId: settingsRecord.userId || '',
          apiKey,
        })
      ).rejects.toSatisfy((error: unknown) => {
        return (
          error instanceof ProviderSearchError &&
          error.kind === 'network' &&
          error.message === 'Provider page 3 failure'
        );
      });

      const savedPosts = await mockDb.db
        .select()
        .from(posts)
        .where(eq(posts.artistId, artist.id));

      expect(savedPosts).toHaveLength(200);

      const updatedArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });

      // Cursor must not advance on incomplete pagination — resume can refill gaps
      expect(updatedArtist?.lastPostId).toBe(0);
      expect(updatedArtist?.lastSyncIncomplete).toBe(true);
      expect(updatedArtist?.lastChecked).toBeNull();
    } finally {
      fetchPostsSpy.mockRestore();
    }
  });

  it('should not advance cursor after mid-batch commit when a later page fails', async () => {
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });

    if (!artist) {
      throw new Error('Artist setup failed');
    }

    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    const createPage = (startId: number): BooruPost[] =>
      Array.from({ length: 100 }, (_, index) => {
        const id = startId + index;
        return {
          id,
          fileUrl: `https://cdn.example.com/${id}.jpg`,
          previewUrl: `https://cdn.example.com/${id}-preview.jpg`,
          sampleUrl: `https://cdn.example.com/${id}-sample.jpg`,
          tags: ['artist_name', `tag_${id}`],
          rating: 's',
          score: 0,
          source: '',
          width: 1000,
          height: 1000,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        };
      });

    const provider = getProvider('rule34');
    // 5 full pages → mid-batch commit at 500 posts; page 5 throws
    const fetchPostsSpy = vi.spyOn(provider, 'fetchPosts').mockImplementation(
      async (_tags, page) => {
        if (page >= 0 && page <= 4) {
          return createPage(page * 100 + 1);
        }
        if (page === 5) {
          throw new ProviderSearchError('network', 'Provider failure after mid-batch');
        }
        return [];
      }
    );

    try {
      await expect(
        service.syncArtist(artist, {
          userId: settingsRecord.userId || '',
          apiKey,
        })
      ).rejects.toSatisfy((error: unknown) => {
        return (
          error instanceof ProviderSearchError &&
          error.message === 'Provider failure after mid-batch'
        );
      });

      const savedPosts = await mockDb.db
        .select()
        .from(posts)
        .where(eq(posts.artistId, artist.id));

      expect(savedPosts).toHaveLength(500);

      const updatedArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });

      expect(updatedArtist?.lastPostId).toBe(0);
      expect(updatedArtist?.lastSyncIncomplete).toBe(true);
      expect(updatedArtist?.newPostsCount).toBe(500);
    } finally {
      fetchPostsSpy.mockRestore();
    }
  });

  it('should resume and complete pagination after a mid-run failure without skipping pages', async () => {
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });

    if (!artist) {
      throw new Error('Artist setup failed');
    }

    // Incremental path (avoids initial-sync FTS rebuild edge cases under abort+retry)
    await mockDb.db
      .update(artists)
      .set({ lastPostId: 50 })
      .where(eq(artists.id, artist.id));

    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    const createPage = (startId: number, count = 100): BooruPost[] =>
      Array.from({ length: count }, (_, index) => {
        const id = startId + index;
        return {
          id,
          fileUrl: `https://cdn.example.com/${id}.jpg`,
          previewUrl: `https://cdn.example.com/${id}-preview.jpg`,
          sampleUrl: `https://cdn.example.com/${id}-sample.jpg`,
          tags: ['artist_name', `tag_${id}`],
          rating: 's',
          score: 0,
          source: '',
          width: 1000,
          height: 1000,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        };
      });

    const provider = getProvider('rule34');
    let failOnce = true;
    const fetchPostsSpy = vi.spyOn(provider, 'fetchPosts').mockImplementation(
      async (_tags, page) => {
        if (page === 0) {
          return createPage(51);
        }
        if (page === 1 && failOnce) {
          failOnce = false;
          throw new ProviderSearchError('network', 'Transient page 2 failure');
        }
        if (page === 1) {
          return createPage(151);
        }
        if (page === 2) {
          return createPage(251, 50);
        }
        return [];
      }
    );

    try {
      const artistBefore = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      if (!artistBefore) {
        throw new Error('Artist missing before sync');
      }

      await expect(
        service.syncArtist(artistBefore, {
          userId: settingsRecord.userId || '',
          apiKey,
        })
      ).rejects.toSatisfy((error: unknown) => {
        return (
          error instanceof ProviderSearchError &&
          error.message === 'Transient page 2 failure'
        );
      });

      let updatedArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      expect(updatedArtist?.lastPostId).toBe(50);
      expect(updatedArtist?.lastSyncIncomplete).toBe(true);

      const afterFailure = await mockDb.db
        .select()
        .from(posts)
        .where(eq(posts.artistId, artist.id));
      expect(afterFailure).toHaveLength(100);

      updatedArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      if (!updatedArtist) {
        throw new Error('Artist missing after failure');
      }

      await service.syncArtist(updatedArtist, {
        userId: settingsRecord.userId || '',
        apiKey,
      });

      const afterResume = await mockDb.db
        .select()
        .from(posts)
        .where(eq(posts.artistId, artist.id));
      expect(afterResume).toHaveLength(250);

      const finalArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      expect(finalArtist?.lastPostId).toBe(300);
      expect(finalArtist?.lastSyncIncomplete).toBe(false);
      expect(finalArtist?.lastChecked).not.toBeNull();
    } finally {
      fetchPostsSpy.mockRestore();
    }
  });

  it('should treat a full page of already-known posts as completed incremental sync', async () => {
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });

    if (!artist) {
      throw new Error('Artist setup failed');
    }

    await mockDb.db
      .update(artists)
      .set({ lastPostId: 500, lastSyncIncomplete: false, lastChecked: null })
      .where(eq(artists.id, artist.id));

    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    const createPage = (startId: number): BooruPost[] =>
      Array.from({ length: 100 }, (_, index) => {
        const id = startId + index;
        return {
          id,
          fileUrl: `https://cdn.example.com/${id}.jpg`,
          previewUrl: `https://cdn.example.com/${id}-preview.jpg`,
          sampleUrl: `https://cdn.example.com/${id}-sample.jpg`,
          tags: ['artist_name', `tag_${id}`],
          rating: 's',
          score: 0,
          source: '',
          width: 1000,
          height: 1000,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        };
      });

    const provider = getProvider('rule34');
    // Full PAGE_SIZE of posts all ≤ lastPostId → newPosts empty, still completed
    const fetchPostsSpy = vi.spyOn(provider, 'fetchPosts').mockResolvedValue(
      createPage(401)
    );

    try {
      const artistBefore = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      if (!artistBefore) {
        throw new Error('Artist missing');
      }

      await service.syncArtist(artistBefore, {
        userId: settingsRecord.userId || '',
        apiKey,
      });

      const updatedArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });

      expect(updatedArtist?.lastPostId).toBe(500);
      expect(updatedArtist?.lastSyncIncomplete).toBe(false);
      expect(updatedArtist?.lastChecked).not.toBeNull();
    } finally {
      fetchPostsSpy.mockRestore();
    }
  });

  it('should not mark pagination complete if the short last page fails after fetch', async () => {
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });

    if (!artist) {
      throw new Error('Artist setup failed');
    }

    await mockDb.db
      .update(artists)
      .set({ lastPostId: 50 })
      .where(eq(artists.id, artist.id));

    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    const createPost = (id: number): BooruPost => ({
      id,
      fileUrl: `https://cdn.example.com/${id}.jpg`,
      previewUrl: `https://cdn.example.com/${id}-preview.jpg`,
      sampleUrl: `https://cdn.example.com/${id}-sample.jpg`,
      tags: ['artist_name', `tag_${id}`],
      rating: 's',
      score: 0,
      source: '',
      width: 1000,
      height: 1000,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    });

    const provider = getProvider('rule34');
    const fetchPostsSpy = vi.spyOn(provider, 'fetchPosts').mockImplementation(
      async (_tags, page) => {
        if (page === 0) {
          return Array.from({ length: 100 }, (_, index) =>
            createPost(51 + index)
          );
        }
        if (page === 1) {
          // Short last page: fetch succeeded; processing throws before completion flag
          const boomPost = createPost(151);
          Object.defineProperty(boomPost, 'fileUrl', {
            configurable: true,
            get(): string {
              throw new Error('Processing failure on short last page');
            },
          });
          return [boomPost, createPost(152)];
        }
        return [];
      }
    );

    try {
      const artistBefore = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      if (!artistBefore) {
        throw new Error('Artist missing');
      }

      await expect(
        service.syncArtist(artistBefore, {
          userId: settingsRecord.userId || '',
          apiKey,
        })
      ).rejects.toThrow('Processing failure on short last page');

      const updatedArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });

      expect(updatedArtist?.lastPostId).toBe(50);
      expect(updatedArtist?.lastSyncIncomplete).toBe(true);

      const savedPosts = await mockDb.db
        .select()
        .from(posts)
        .where(eq(posts.artistId, artist.id));
      // Page 0 buffered then partial-committed; last short page never entered the batch
      expect(savedPosts).toHaveLength(100);
    } finally {
      fetchPostsSpy.mockRestore();
    }
  });

  it('should rethrow axios network errors instead of silent success', async () => {
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });

    if (!artist) {
      throw new Error('Artist setup failed');
    }

    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    const axios = await import('axios');
    const provider = getProvider('rule34');
    const fetchPostsSpy = vi.spyOn(provider, 'fetchPosts').mockImplementation(async () => {
      throw new axios.AxiosError('Network down', 'ERR_NETWORK');
    });

    try {
      await expect(
        service.syncArtist(artist, {
          userId: settingsRecord.userId || '',
          apiKey,
        })
      ).rejects.toSatisfy((error: unknown) => {
        return (
          error instanceof ProviderSearchError && error.kind === 'network'
        );
      });

      const updatedArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      expect(updatedArtist?.lastPostId).toBe(0);
      expect(updatedArtist?.lastSyncIncomplete).toBe(true);
    } finally {
      fetchPostsSpy.mockRestore();
    }
  });

  it('should surface auth provider errors via SYNC.ERROR instead of silent success', async () => {
    const provider = getProvider('rule34');
    const fetchPostsSpy = vi
      .spyOn(provider, 'fetchPosts')
      .mockRejectedValue(new ProviderSearchError('auth'));

    const sendEventSpy = vi
      .spyOn(service, 'sendEvent')
      .mockImplementation(() => undefined);

    try {
      await service.syncAllArtists();

      expect(fetchPostsSpy).toHaveBeenCalled();
      expect(sendEventSpy).toHaveBeenCalledWith(
        IPC_CHANNELS.SYNC.ERROR,
        expect.stringContaining('Test Artist')
      );
      expect(sendEventSpy).toHaveBeenCalledWith(
        IPC_CHANNELS.SYNC.ERROR,
        expect.stringContaining('Settings')
      );
    } finally {
      sendEventSpy.mockRestore();
      fetchPostsSpy.mockRestore();
    }
  });

  it('should paginate initial sync across multiple full PAGE_SIZE pages', async () => {
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });

    if (!artist) {
      throw new Error('Artist setup failed');
    }

    await mockDb.db
      .update(artists)
      .set({ lastPostId: 0, lastSyncIncomplete: false, lastChecked: null })
      .where(eq(artists.id, artist.id));

    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey = safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
      ? safeStorage.decryptString(Buffer.from(settingsRecord.encryptedApiKey, 'base64'))
      : settingsRecord.encryptedApiKey || '';

    const createPosts = (startId: number, count: number): BooruPost[] =>
      Array.from({ length: count }, (_, index) => {
        const id = startId + index;
        return {
          id,
          fileUrl: `https://cdn.example.com/${id}.jpg`,
          previewUrl: `https://cdn.example.com/${id}-preview.jpg`,
          sampleUrl: `https://cdn.example.com/${id}-sample.jpg`,
          tags: ['artist_name', `tag_${id}`],
          rating: 's',
          score: 0,
          source: '',
          width: 1000,
          height: 1000,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        };
      });

    const SHORT_LAST_PAGE = 40;
    const EXPECTED_TOTAL = PAGE_SIZE * 2 + SHORT_LAST_PAGE;

    const provider = getProvider('rule34');
    // Simulates Rule34's old silent default (50): without an explicit PAGE_SIZE limit,
    // page 0 returns 50 items and sync wrongly treats that as end-of-pagination.
    const fetchPostsSpy = vi.spyOn(provider, 'fetchPosts').mockImplementation(
      async (_tags, page, _settings, _isRandom, limit) => {
        if (limit !== PAGE_SIZE) {
          if (page === 0) {
            return createPosts(1, 50);
          }
          return [];
        }
        if (page === 0) {
          return createPosts(1, PAGE_SIZE);
        }
        if (page === 1) {
          return createPosts(PAGE_SIZE + 1, PAGE_SIZE);
        }
        if (page === 2) {
          return createPosts(PAGE_SIZE * 2 + 1, SHORT_LAST_PAGE);
        }
        return [];
      }
    );

    try {
      const artistBefore = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      if (!artistBefore) {
        throw new Error('Artist missing');
      }

      await service.syncArtist(artistBefore, {
        userId: settingsRecord.userId || '',
        apiKey,
      });

      const savedPosts = await mockDb.db
        .select()
        .from(posts)
        .where(eq(posts.artistId, artist.id));
      expect(savedPosts).toHaveLength(EXPECTED_TOTAL);

      expect(fetchPostsSpy).toHaveBeenCalledWith(
        expect.any(String),
        0,
        expect.objectContaining({
          userId: expect.any(String),
          apiKey: expect.any(String),
        }),
        false,
        PAGE_SIZE
      );
      expect(fetchPostsSpy).toHaveBeenCalledTimes(3);

      const updatedArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      expect(updatedArtist?.lastPostId).toBe(EXPECTED_TOTAL);
      expect(updatedArtist?.lastSyncIncomplete).toBe(false);
      expect(updatedArtist?.lastChecked).not.toBeNull();
    } finally {
      fetchPostsSpy.mockRestore();
    }
  });

  it('should cancel mid-pagination without advancing lastPostId and keep page-0 posts', async () => {
    const artist = await mockDb.db.query.artists.findFirst({
      where: eq(artists.tag, 'artist_name'),
    });

    if (!artist) {
      throw new Error('Artist setup failed');
    }

    const INITIAL_LAST_POST_ID = 50;
    await mockDb.db
      .update(artists)
      .set({ lastPostId: INITIAL_LAST_POST_ID, lastSyncIncomplete: false })
      .where(eq(artists.id, artist.id));

    const settingsRecord = await mockDb.db.query.settings.findFirst({
      where: eq(settings.id, SETTINGS_ID),
    });

    if (!settingsRecord) {
      throw new Error('Settings setup failed');
    }

    const { safeStorage } = await import('electron');
    const apiKey =
      safeStorage.isEncryptionAvailable() && settingsRecord.encryptedApiKey
        ? safeStorage.decryptString(
            Buffer.from(settingsRecord.encryptedApiKey, 'base64')
          )
        : settingsRecord.encryptedApiKey || '';

    const createPage = (startId: number, count = PAGE_SIZE): BooruPost[] =>
      Array.from({ length: count }, (_, index) => {
        const id = startId + index;
        return {
          id,
          fileUrl: `https://cdn.example.com/${id}.jpg`,
          previewUrl: `https://cdn.example.com/${id}-preview.jpg`,
          sampleUrl: `https://cdn.example.com/${id}-sample.jpg`,
          tags: ['artist_name', `tag_${id}`],
          rating: 's',
          score: 0,
          source: '',
          width: 1000,
          height: 1000,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
        };
      });

    const PAGE1_HANG_MS = 40;
    let cancelOnNextPage1 = true;
    const provider = getProvider('rule34');
    const fetchPostsSpy = vi.spyOn(provider, 'fetchPosts').mockImplementation(
      async (_tags, page) => {
        if (page === 0) {
          return createPage(INITIAL_LAST_POST_ID + 1, PAGE_SIZE);
        }
        if (page === 1) {
          if (cancelOnNextPage1) {
            cancelOnNextPage1 = false;
            service.requestCancel();
            await new Promise((resolve) => setTimeout(resolve, PAGE1_HANG_MS));
          }
          return createPage(INITIAL_LAST_POST_ID + PAGE_SIZE + 1, PAGE_SIZE);
        }
        return createPage(INITIAL_LAST_POST_ID + PAGE_SIZE * 2 + 1, 25);
      }
    );

    try {
      const artistBefore = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      if (!artistBefore) {
        throw new Error('Artist missing before sync');
      }

      await expect(
        service.syncArtist(artistBefore, {
          userId: settingsRecord.userId || '',
          apiKey,
        })
      ).rejects.toSatisfy(
        (error: unknown) =>
          isSyncCancelledError(error) || error instanceof SyncCancelledError
      );

      const afterCancel = await mockDb.db
        .select()
        .from(posts)
        .where(eq(posts.artistId, artist.id));
      expect(afterCancel).toHaveLength(PAGE_SIZE);

      let updatedArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      expect(updatedArtist?.lastPostId).toBe(INITIAL_LAST_POST_ID);
      expect(updatedArtist?.lastSyncIncomplete).toBe(true);

      // Resume via syncAllArtists (resets cancelRequested at exclusive start)
      await service.syncAllArtists();

      const afterResume = await mockDb.db
        .select()
        .from(posts)
        .where(eq(posts.artistId, artist.id));
      expect(afterResume).toHaveLength(PAGE_SIZE * 2 + 25);

      updatedArtist = await mockDb.db.query.artists.findFirst({
        where: eq(artists.id, artist.id),
      });
      expect(updatedArtist?.lastPostId).toBe(
        INITIAL_LAST_POST_ID + PAGE_SIZE * 2 + 25
      );
      expect(updatedArtist?.lastSyncIncomplete).toBe(false);
    } finally {
      fetchPostsSpy.mockRestore();
    }
  });
});
