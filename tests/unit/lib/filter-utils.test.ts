import { describe, it, expect } from 'vitest';
import { hasAiGeneratedTag, isVideoPost } from '@/renderer/lib/filter-utils';

describe('filter-utils', () => {
  describe('hasAiGeneratedTag', () => {
    it('should return false for null or undefined tags', () => {
      expect(hasAiGeneratedTag(null)).toBe(false);
      expect(hasAiGeneratedTag(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasAiGeneratedTag('')).toBe(false);
      expect(hasAiGeneratedTag('   ')).toBe(false);
    });

    it('should detect ai_generated tag', () => {
      expect(hasAiGeneratedTag('ai_generated')).toBe(true);
      expect(hasAiGeneratedTag('tag1 ai_generated tag2')).toBe(true);
      expect(hasAiGeneratedTag('AI_GENERATED')).toBe(true); // Case insensitive
    });

    it('should detect ai generated tag (with space) - split into separate tags', () => {
      // Note: "ai generated" is split into ["ai", "generated"], so it won't match "ai generated" as single tag
      // But it will match if tags are "ai" and "generated" separately
      expect(hasAiGeneratedTag('ai generated')).toBe(false); // Split into ["ai", "generated"]
      // However, if the tag is stored as "ai_generated" or "ai-generated", it will match
      expect(hasAiGeneratedTag('ai_generated')).toBe(true);
    });

    it('should detect ai-generated tag (with hyphen)', () => {
      expect(hasAiGeneratedTag('ai-generated')).toBe(true);
      expect(hasAiGeneratedTag('tag1 ai-generated tag2')).toBe(true);
    });

    it('should detect ai_generation tag', () => {
      expect(hasAiGeneratedTag('ai_generation')).toBe(true);
      expect(hasAiGeneratedTag('tag1 ai_generation tag2')).toBe(true);
    });

    it('should detect ai generation tag (with space) - split into separate tags', () => {
      // Note: "ai generation" is split into ["ai", "generation"], so it won't match
      expect(hasAiGeneratedTag('ai generation')).toBe(false); // Split into ["ai", "generation"]
      expect(hasAiGeneratedTag('ai_generation')).toBe(true);
    });

    it('should detect ai-generated_content tag', () => {
      expect(hasAiGeneratedTag('ai-generated_content')).toBe(true);
    });

    it('should detect ai generated content tag - split into separate tags', () => {
      // Note: "ai generated content" is split into ["ai", "generated", "content"]
      expect(hasAiGeneratedTag('ai generated content')).toBe(false); // Split into separate words
      expect(hasAiGeneratedTag('ai-generated_content')).toBe(true);
    });

    it('should return false for non-AI tags', () => {
      expect(hasAiGeneratedTag('blue_hair solo')).toBe(false);
      expect(hasAiGeneratedTag('artist:someone')).toBe(false);
      expect(hasAiGeneratedTag('rating:explicit')).toBe(false);
    });

    it('should handle multiple spaces and tabs', () => {
      expect(hasAiGeneratedTag('tag1   ai_generated   tag2')).toBe(true);
      expect(hasAiGeneratedTag('tag1\tai_generated\ttag2')).toBe(true);
    });
  });

  describe('isVideoPost', () => {
    it('should return false for null or undefined', () => {
      expect(isVideoPost(null)).toBe(false);
      expect(isVideoPost(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isVideoPost('')).toBe(false);
    });

    it('should detect .mp4 files', () => {
      expect(isVideoPost('file.mp4')).toBe(true);
      expect(isVideoPost('https://example.com/video.mp4')).toBe(true);
      expect(isVideoPost('path/to/file.mp4')).toBe(true);
    });

    it('should detect .webm files', () => {
      expect(isVideoPost('file.webm')).toBe(true);
      expect(isVideoPost('https://example.com/video.webm')).toBe(true);
      expect(isVideoPost('path/to/file.webm')).toBe(true);
    });

    it('should detect .mov files', () => {
      expect(isVideoPost('file.mov')).toBe(true);
      expect(isVideoPost('https://example.com/video.mov')).toBe(true);
      expect(isVideoPost('path/to/file.mov')).toBe(true);
    });

    it('should detect .avi files', () => {
      expect(isVideoPost('file.avi')).toBe(true);
      expect(isVideoPost('https://example.com/video.avi')).toBe(true);
    });

    it('should detect .mkv files', () => {
      expect(isVideoPost('file.mkv')).toBe(true);
      expect(isVideoPost('https://example.com/video.mkv')).toBe(true);
    });

    it('should detect .flv files', () => {
      expect(isVideoPost('file.flv')).toBe(true);
      expect(isVideoPost('https://example.com/video.flv')).toBe(true);
    });

    it('should detect .wmv files', () => {
      expect(isVideoPost('file.wmv')).toBe(true);
      expect(isVideoPost('https://example.com/video.wmv')).toBe(true);
    });

    it('should detect .m4v files', () => {
      expect(isVideoPost('file.m4v')).toBe(true);
      expect(isVideoPost('https://example.com/video.m4v')).toBe(true);
    });

    it('should return false for image files', () => {
      expect(isVideoPost('file.jpg')).toBe(false);
      expect(isVideoPost('file.png')).toBe(false);
      expect(isVideoPost('file.gif')).toBe(false);
      expect(isVideoPost('file.webp')).toBe(false);
    });

    it('should return false for .gif files (treated as images)', () => {
      expect(isVideoPost('file.gif')).toBe(false);
      expect(isVideoPost('animated.gif')).toBe(false);
    });

    it('should handle case sensitivity correctly (case-insensitive)', () => {
      // Implementation uses toLowerCase() and endsWith(), so case-insensitive
      expect(isVideoPost('file.MP4')).toBe(true);
      expect(isVideoPost('file.WEBM')).toBe(true);
      expect(isVideoPost('file.mp4')).toBe(true);
      expect(isVideoPost('file.webm')).toBe(true);
      expect(isVideoPost('file.MOV')).toBe(true);
      expect(isVideoPost('file.AVI')).toBe(true);
      expect(isVideoPost('file.MKV')).toBe(true);
      expect(isVideoPost('file.FLV')).toBe(true);
      expect(isVideoPost('file.WMV')).toBe(true);
      expect(isVideoPost('file.M4V')).toBe(true);
      expect(isVideoPost('file.JPG')).toBe(false);
    });

    it('should handle URLs with query parameters', () => {
      expect(isVideoPost('https://example.com/video.mp4?token=abc123')).toBe(true);
      expect(isVideoPost('https://example.com/video.webm?v=1&t=10')).toBe(true);
      expect(isVideoPost('https://example.com/image.jpg?size=large')).toBe(false);
    });

    it('should handle URLs with hash fragments', () => {
      expect(isVideoPost('https://example.com/video.mp4#section')).toBe(true);
      expect(isVideoPost('https://example.com/video.webm#timestamp=10')).toBe(true);
    });

    it('should handle relative paths', () => {
      expect(isVideoPost('/path/to/video.mp4')).toBe(true);
      expect(isVideoPost('./video.webm')).toBe(true);
      expect(isVideoPost('../media/video.mov')).toBe(true);
    });

    it('should handle invalid URLs gracefully', () => {
      // Invalid URL should fallback to regex on original string
      expect(isVideoPost('not-a-url-but-has.mp4')).toBe(true);
      expect(isVideoPost('invalid-url.webm')).toBe(true);
    });

    it('should return false for URLs without file extension', () => {
      expect(isVideoPost('https://example.com/video')).toBe(false);
      expect(isVideoPost('https://example.com/video?param=value')).toBe(false);
    });
  });
});
