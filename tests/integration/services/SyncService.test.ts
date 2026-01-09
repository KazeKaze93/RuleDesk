import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createMockDb } from '../../helpers/mock-db';
import { server } from '../../mocks/server';
import { artists, posts, settings, SETTINGS_ID } from '@/main/db/schema';
import { eq } from 'drizzle-orm';
import { PROVIDER_IDS, ARTIST_TYPES } from '@/shared/constants';

// Mock Electron BEFORE imports
vi.mock('electron', () => ({
  app: { getPath: () => '/tmp' },
  safeStorage: {
    isEncryptionAvailable: () => true,
    decryptString: (buffer: Buffer) => {
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

vi.mock('@/main/db/client', () => ({
  getDb: () => {
    if (!mockDbInstance) {
      throw new Error('Mock DB not set. Call setMockDbInstance() first.');
    }
    return mockDbInstance;
  },
  initializeDatabase: vi.fn(),
  getSqliteInstance: vi.fn(),
  closeDatabase: vi.fn(),
}));

// Import after mocks
import { SyncService } from '@/main/services/sync-service';

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
    // 1. Setup DB
    mockDb = createMockDb();
    
    // 2. Inject mock DB into getDb() mock
    mockDbInstance = mockDb.db;

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
    // Close database connection
    mockDb.sqlite.close();
    mockDbInstance = null;
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

    // Act - Sync should handle error gracefully
    // SyncService has retry logic, so it might not throw immediately
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
  });
});
