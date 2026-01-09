import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockDb } from '../../helpers/mock-db';
import { ARTIST_TYPES, PROVIDER_IDS } from '@/shared/constants';
import { container, DI_TOKENS } from '@/main/core/di/Container';
import { artists } from '@/main/db/schema';
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

  beforeEach(() => {
    // Create in-memory database
    mockDb = createMockDb();

    // Register mock DB in DI container
    // Container.register expects the instance directly, not wrapped in an object
    container.register(DI_TOKENS.DB, mockDb.db);

    // Instantiate controller
    controller = new ArtistsController();
  });

  afterEach(() => {
    // Close database connection
    mockDb.sqlite.close();

    // Clear DI container registrations
    // Note: Container might not have a clear method, so we'll just close the DB
    // The container will be reused for next test
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
  });
});
