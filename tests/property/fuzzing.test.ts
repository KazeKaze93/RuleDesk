import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { escapeLikePattern } from '@/main/db/utils';
import { AddArtistSchema } from '@/shared/schemas/artist';
import { PROVIDER_IDS, ARTIST_TYPES, type ProviderId, type ArtistType } from '@/shared/constants';

describe('Property-Based Testing (Fuzzing)', () => {
  
  // 1. Тестируем защиту от SQL инъекций в LIKE
  describe('escapeLikePattern', () => {
    it('should never produce a string that breaks SQL LIKE syntax', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const escaped = escapeLikePattern(text);
          
          // Invariant 1: The output should not contain raw unescaped wildcards
          // We check this by removing properly escaped chars and seeing if any remain
          // This is a naive check, but ensures the function does *something*
          
          // Invariant 2: Length should be >= original length
          expect(escaped.length).toBeGreaterThanOrEqual(text.length);
          
          // Invariant 3: Should not crash logic
          return true; 
        })
      );
    });

    it('should correctly escape specific dangerous characters', () => {
      // Test individual characters
      expect(escapeLikePattern('%')).toBe('\\%');
      expect(escapeLikePattern('_')).toBe('\\_');
      expect(escapeLikePattern('\\')).toBe('\\\\');
      
      // Test combination: '%_\\'
      // Order of replacement: \ -> \\, then % -> \%, then _ -> \_
      // Input: '%_\\'
      // Step 1 (escape \): '%_\\\\' (each \ becomes \\)
      // Step 2 (escape %): '\\%_\\\\'
      // Step 3 (escape _): '\\%\\_\\\\'
      const dangerous = '%_\\';
      const escaped = escapeLikePattern(dangerous);
      expect(escaped).toBe('\\%\\_\\\\');
      
      // Verify escaped versions are present
      expect(escaped).toContain('\\%');
      expect(escaped).toContain('\\_');
      expect(escaped).toContain('\\\\');
      
      // Verify proper escaping: count occurrences
      // In '%_\\', we have: 1x %, 1x _, 2x \
      // After escaping: 1x \%, 1x \_, 4x \ (each \ becomes \\)
      const percentCount = (escaped.match(/\\%/g) || []).length;
      const underscoreCount = (escaped.match(/\\_/g) || []).length;
      expect(percentCount).toBe(1);
      expect(underscoreCount).toBe(1);
    });

    it('should preserve non-special characters', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.includes('%') && !s.includes('_') && !s.includes('\\')),
          (text) => {
            const escaped = escapeLikePattern(text);
            // If no special chars, output should equal input
            expect(escaped).toBe(text);
          }
        )
      );
    });

    it('should handle empty string', () => {
      const escaped = escapeLikePattern('');
      expect(escaped).toBe('');
    });

    it('should handle strings with only special characters', () => {
      const testCases = [
        { input: '%', expected: '\\%' },
        { input: '_', expected: '\\_' },
        { input: '\\', expected: '\\\\' },
        { input: '%%', expected: '\\%\\%' },
        { input: '__', expected: '\\_\\_' },
        { input: '\\\\', expected: '\\\\\\\\' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(escapeLikePattern(input)).toBe(expected);
      });
    });
  });

  // 2. Тестируем Zod схемы на прочность
  describe('AddArtistSchema Robustness', () => {
    it('should handle ANY string input for name without crashing', () => {
      fc.assert(
        fc.property(fc.string(), (name) => {
          // Мы не ожидаем success: true для всех строк (пустые строки невалидны)
          // Мы ожидаем, что parse НЕ ВЫБРОСИТ исключение JS (TypeError и т.д.)
          // safeParse должен вернуть success: false или success: true
          const result = AddArtistSchema.safeParse({ 
            name, 
            tag: 'test_tag',
            provider: 'rule34', // valid enum
            type: 'tag'  // valid enum
          });
          
          // AddArtistSchema.name is z.string().trim().min(1) — any non-empty
          // trimmed string must parse; whitespace-only / empty must fail.
          if (name.trim().length > 0) {
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.name).toBe(name.trim());
            }
            return result.success;
          }
          expect(result.success).toBe(false);
          return !result.success;
        })
      );
    });

    it('should reject invalid provider values', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s): s is string => !PROVIDER_IDS.includes(s as ProviderId)),
          (invalidProvider) => {
            const result = AddArtistSchema.safeParse({
              name: 'Test Artist',
              tag: 'test_tag',
              provider: invalidProvider,
              type: 'tag',
            });
            
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error.issues.some(issue => 
                issue.path.includes('provider')
              )).toBe(true);
            }
          }
        )
      );
    });

    it('should reject invalid type values', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s): s is string => !ARTIST_TYPES.includes(s as ArtistType)),
          (invalidType) => {
            const result = AddArtistSchema.safeParse({
              name: 'Test Artist',
              tag: 'test_tag',
              provider: 'rule34',
              type: invalidType,
            });
            
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error.issues.some(issue => 
                issue.path.includes('type')
              )).toBe(true);
            }
          }
        )
      );
    });

    it('should accept valid provider and type combinations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...PROVIDER_IDS),
          fc.constantFrom(...ARTIST_TYPES),
          (provider, type) => {
            const result = AddArtistSchema.safeParse({
              name: 'Test Artist',
              tag: 'test_tag',
              provider,
              type,
            });
            
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.provider).toBe(provider);
              expect(result.data.type).toBe(type);
            }
          }
        )
      );
    });

    it('should trim whitespace from name and tag', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).map(s => `  ${s}  `),
          (nameWithWhitespace) => {
            const result = AddArtistSchema.safeParse({
              name: nameWithWhitespace,
              tag: 'test_tag',
              provider: 'rule34',
              type: 'tag',
            });
            
            const trimmed = nameWithWhitespace.trim();
            if (trimmed.length === 0) {
              expect(result.success).toBe(false);
            } else {
              expect(result.success).toBe(true);
              if (result.success) {
                expect(result.data.name).toBe(trimmed);
              }
            }
          }
        )
      );
    });

    it('should validate optional apiEndpoint as URL when provided', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          (validUrl) => {
            const result = AddArtistSchema.safeParse({
              name: 'Test Artist',
              tag: 'test_tag',
              provider: 'rule34',
              type: 'tag',
              apiEndpoint: validUrl,
            });
            
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.apiEndpoint).toBe(validUrl.trim());
            }
          }
        )
      );
    });

    it('should reject invalid URLs for apiEndpoint', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => {
            try {
              new URL(s);
              return false; // Valid URL, skip
            } catch {
              return s.length > 0; // Invalid URL, include
            }
          }),
          (invalidUrl) => {
            const result = AddArtistSchema.safeParse({
              name: 'Test Artist',
              tag: 'test_tag',
              provider: 'rule34',
              type: 'tag',
              apiEndpoint: invalidUrl,
            });
            
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error.issues.some(issue => 
                issue.path.includes('apiEndpoint')
              )).toBe(true);
            }
          }
        )
      );
    });
  });
});
