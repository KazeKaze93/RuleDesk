/**
 * Нормализует строку тега, удаляя лишние префиксы, пробелы и счетчики постов.
 * @param input Исходная строка тега (например, "user:tag (123)")
 * @returns Очищенный тег (например, "tag")
 */
export function normalizeTag(input: string): string {
  if (!input) {
    return "";
  }
  return input
    .trim()
    .toLowerCase() // Приводим к нижнему регистру для каноничности
    .replace(/^#\s*/g, "") // Убираем # в начале
    .replace(/^user:/i, "") // Убираем префикс user:
    .replace(/\s*\(\d+\)\s*$/g, ""); // Убираем (123) в конце
}

