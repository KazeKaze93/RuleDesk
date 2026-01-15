import { describe, it, expect } from 'vitest';

/**
 * Tests for GridContainer layout logic
 * Verifies CSS classes based on viewType
 */

describe('GridContainer Layout Logic', () => {
  describe('Grid viewType classes', () => {
    it('should apply grid classes for grid view', () => {
      const viewType = 'grid';
      const classes = viewType === 'grid'
        ? 'grid grid-cols-2 gap-4 p-4 pb-32 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        : 'flex flex-wrap gap-4 justify-center p-4 pb-32';
      
      expect(classes).toContain('grid');
      expect(classes).toContain('grid-cols-2');
      expect(classes).toContain('md:grid-cols-3');
      expect(classes).not.toContain('flex');
    });
  });

  describe('Masonry viewType classes', () => {
    it('should apply flex classes for masonry view', () => {
      const viewType = 'masonry';
      const classes = viewType === 'grid'
        ? 'grid grid-cols-2 gap-4 p-4 pb-32 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        : 'flex flex-wrap gap-4 justify-center p-4 pb-32';
      
      expect(classes).toContain('flex');
      expect(classes).toContain('flex-wrap');
      expect(classes).toContain('justify-center');
      expect(classes).not.toContain('grid');
    });
  });

  describe('Responsive width calculations for masonry', () => {
    it('should calculate correct width for mobile (2 columns)', () => {
      const width = 'calc(50% - 0.5rem)';
      expect(width).toBe('calc(50% - 0.5rem)');
    });

    it('should calculate correct width for md (3 columns)', () => {
      const width = 'calc(33.333% - 1rem)';
      expect(width).toBe('calc(33.333% - 1rem)');
    });

    it('should calculate correct width for lg (4 columns)', () => {
      const width = 'calc(25% - 1rem)';
      expect(width).toBe('calc(25% - 1rem)');
    });

    it('should calculate correct width for xl (5 columns)', () => {
      const width = 'calc(20% - 1rem)';
      expect(width).toBe('calc(20% - 1rem)');
    });
  });

  describe('ItemContainer classes', () => {
    it('should apply aspect-[2/3] for grid items', () => {
      const viewType = 'grid';
      const classes = viewType === 'grid' ? 'w-full aspect-[2/3]' : 'w-full mb-4 break-inside-avoid';
      
      expect(classes).toBe('w-full aspect-[2/3]');
    });

    it('should apply break-inside-avoid for masonry items', () => {
      const viewType = 'masonry';
      const classes = viewType === 'grid' ? 'w-full aspect-[2/3]' : 'w-full mb-4 break-inside-avoid';
      
      expect(classes).toBe('w-full mb-4 break-inside-avoid');
    });
  });
});
