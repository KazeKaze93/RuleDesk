export function getArtistTag(
  name: string,
  type: "tag" | "uploader" | "query"
): string {
  const trimmedName = name.trim();

  if (type === "uploader") {
    // Uploader form: 'user:username'
    return `user:${trimmedName}`;
  }
  // Tag form: lowercase 'tag_name' with spaces as underscores
  return trimmedName.toLowerCase().replace(/ /g, "_");
}
