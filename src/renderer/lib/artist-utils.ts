export function getArtistTag(
  name: string,
  type: "tag" | "uploader" | "query"
): string {
  const trimmedName = name.trim();

  if (type === "uploader") {
    // Для Uploader: 'user:username'
    return `user:${trimmedName}`;
  }
  // Для Tag: 'tag_name' (нижний регистр, пробелы в подчеркивания)
  return trimmedName.toLowerCase().replace(/ /g, "_");
}
