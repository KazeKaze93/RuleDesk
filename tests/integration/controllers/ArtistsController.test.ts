import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockDb } from '../../helpers/mock-db';
import { ARTIST_TYPES, PROVIDER_IDS } from '@/shared/constants';
import { container, DI_TOKENS } from '@/main/core/di/Container';
import { artists, settings, SETTINGS_ID } from '@/main/db/schema';
import { eq } from 'drizzle-orm';

// Mock Electron BEFORE imports
vi.mock('electron', () => ({
  app: { getPath: () => '/tmp' },
  ipcMain: { 
    handle: vi.fn(), 
    on: vi.fn(),
    removeHandler: vi.fn(),
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

import { ArtistsController } from '@/main/ipc/controllers/ArtistsController';
import type { AddArtistRequest } from '@/shared/schemas/artist';

describe('ArtistsController Integration', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let controller: ArtistsController;
  let repairArtist: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // CRITICAL: Clear DI container before each test to prevent state leakage
    // This ensures that each test starts with a fresh container state
    container.clear();

    // Create fresh in-memory database (:memory: guarantees clean slate)
    mockDb = createMockDb();

    // Register mock DB in DI container
    // Container.register expects the instance directly, not wrapped in an object
    container.register(DI_TOKENS.DB, mockDb.db);

    repairArtist = vi.fn().mockResolvedValue(undefined);
    container.register(DI_TOKENS.SYNC_SERVICE, { repairArtist });

    // Instantiate controller (will use the fresh DB from container)
    controller = new ArtistsController();
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

    // Clear DI container registrations to prevent state leakage
    // This ensures the next test starts with a clean container
    container.clear();
  });

  describe('handleAddArtist', () => {
    it('should successfully insert a new artist into the database', async () => {
      // Arrange
      const artistData: AddArtistRequest = {
        name: 'Test Artist',
        tag: 'test_artist_tag',
        provider: 'rule34',
        type: 'tag',
      };

      // Act
      const result = await controller.handleAddArtist(null, artistData);

      // Assert - Verify insertion by querying the database directly
      const insertedArtists = await mockDb.db
        .select()
        .from(artists)
        .where(eq(artists.tag, 'test_artist_tag'));

      expect(insertedArtists).toHaveLength(1);
      expect(insertedArtists[0].name).toBe('Test Artist');
      expect(insertedArtists[0].tag).toBe('test_artist_tag');
      expect(insertedArtists[0].provider).toBe('rule34');
      expect(insertedArtists[0].type).toBe('tag');

      // Verify return value
      expect(result.name).toBe('Test Artist');
      expect(result.tag).toBe('test_artist_tag');
      expect(repairArtist).not.toHaveBeenCalled();
    });

    it('should update existing artist when tag already exists', async () => {
      // Arrange - Insert an artist first
      const initialData: AddArtistRequest = {
        name: 'Initial Artist',
        tag: 'existing_tag',
        provider: 'rule34',
        type: 'tag',
      };

      await controller.handleAddArtist(null, initialData);

      // Act - Try to add artist with same tag but different name
      const updatedData: AddArtistRequest = {
        name: 'Updated Artist',
        tag: 'existing_tag',
        provider: 'gelbooru',
        type: 'uploader',
      };

      const result = await controller.handleAddArtist(null, updatedData);

      // Assert - Should have only one artist with this tag
      const artistsInDb = await mockDb.db
        .select()
        .from(artists)
        .where(eq(artists.tag, 'existing_tag'));

      expect(artistsInDb).toHaveLength(1);
      expect(artistsInDb[0].name).toBe('Updated Artist');
      expect(artistsInDb[0].provider).toBe('gelbooru');
      expect(artistsInDb[0].type).toBe('uploader');

      // Verify return value
      expect(result.name).toBe('Updated Artist');
    });

    it('should use default API endpoint when not provided', async () => {
      // Arrange
      const artistData: AddArtistRequest = {
        name: 'Test Artist',
        tag: 'test_tag_no_endpoint',
        provider: 'rule34',
        type: 'tag',
        // apiEndpoint is optional
      };

      // Act
      await controller.handleAddArtist(null, artistData);

      // Assert - Verify that default endpoint was set
      const inserted = await mockDb.db
        .select()
        .from(artists)
        .where(eq(artists.tag, 'test_tag_no_endpoint'));

      expect(inserted).toHaveLength(1);
      expect(inserted[0].apiEndpoint).toBeDefined();
      expect(inserted[0].apiEndpoint).not.toBe('');
    });

    it('should use provided API endpoint when specified', async () => {
      // Arrange
      const customEndpoint = 'https://custom-api.example.com';
      const artistData: AddArtistRequest = {
        name: 'Test Artist',
        tag: 'test_tag_custom_endpoint',
        provider: 'rule34',
        type: 'tag',
        apiEndpoint: customEndpoint,
      };

      // Act
      await controller.handleAddArtist(null, artistData);

      // Assert
      const inserted = await mockDb.db
        .select()
        .from(artists)
        .where(eq(artists.tag, 'test_tag_custom_endpoint'));

      expect(inserted).toHaveLength(1);
      expect(inserted[0].apiEndpoint).toBe(customEndpoint);
    });

    it('should handle all provider types', async () => {
      // Test each provider
      for (const provider of PROVIDER_IDS) {
        const artistData: AddArtistRequest = {
          name: `Test Artist ${provider}`,
          tag: `test_tag_${provider}`,
          provider,
          type: 'tag',
        };

        await controller.handleAddArtist(null, artistData);

        const inserted = await mockDb.db
          .select()
          .from(artists)
          .where(eq(artists.tag, `test_tag_${provider}`));

        expect(inserted).toHaveLength(1);
        expect(inserted[0].provider).toBe(provider);
      }
    });

    it('should handle all artist types', async () => {
      // Test each artist type
      for (const type of ARTIST_TYPES) {
        const artistData: AddArtistRequest = {
          name: `Test Artist ${type}`,
          tag: `test_tag_${type}`,
          provider: 'rule34',
          type,
        };

        await controller.handleAddArtist(null, artistData);

        const inserted = await mockDb.db
          .select()
          .from(artists)
          .where(eq(artists.tag, `test_tag_${type}`));

        expect(inserted).toHaveLength(1);
        expect(inserted[0].type).toBe(type);
      }
    });

    it('does not queue repairArtist when autoSyncOnArtistAdd is disabled', async () => {
      await mockDb.db
        .insert(settings)
        .values({
          id: SETTINGS_ID,
          userId: '123',
          encryptedApiKey: 'encrypted',
          autoSyncOnArtistAdd: false,
        })
        .run();

      const result = await controller.handleAddArtist(null, {
        name: 'No Auto Sync',
        tag: 'no_auto_sync_tag',
        provider: 'rule34',
        type: 'tag',
      });

      expect(result.id).toBeDefined();
      expect(repairArtist).not.toHaveBeenCalled();
    });

    it('queues repairArtist with inserted id when autoSyncOnArtistAdd is enabled', async () => {
      await mockDb.db
        .insert(settings)
        .values({
          id: SETTINGS_ID,
          userId: '123',
          encryptedApiKey: 'encrypted',
          autoSyncOnArtistAdd: true,
        })
        .run();

      const result = await controller.handleAddArtist(null, {
        name: 'Auto Sync Artist',
        tag: 'auto_sync_tag',
        provider: 'rule34',
        type: 'tag',
      });

      expect(result.id).toBeDefined();
      expect(repairArtist).toHaveBeenCalledTimes(1);
      expect(repairArtist).toHaveBeenCalledWith(result.id);
    });

    it('skips repairArtist when autoSyncOnArtistAdd is on but credentials are missing', async () => {
      await mockDb.db
        .insert(settings)
        .values({
          id: SETTINGS_ID,
          userId: '',
          encryptedApiKey: '',
          autoSyncOnArtistAdd: true,
        })
        .run();

      await controller.handleAddArtist(null, {
        name: 'Missing Creds',
        tag: 'missing_creds_tag',
        provider: 'rule34',
        type: 'tag',
      });

      expect(repairArtist).not.toHaveBeenCalled();
    });
  });
});
