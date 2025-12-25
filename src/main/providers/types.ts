export interface BooruPost {
  id: number;
  fileUrl: string;
  previewUrl: string;
  sampleUrl: string;
  tags: string[];
  rating: "s" | "q" | "e";
  score: number;
  source: string;
  width: number;
  height: number;
  createdAt: Date;
}

export interface SearchResults {
  id: string;
  label: string;
  value: string;
  type?: string;
}

export interface ProviderSettings {
  userId?: string;
  apiKey?: string;
}

export interface IBooruProvider {
  id: string;
  name: string;
  /** Validates provided credentials against the API */
  checkAuth(settings: ProviderSettings): Promise<boolean>;
  /** Fetches posts based on tags and page */
  fetchPosts(tags: string, page: number, settings: ProviderSettings): Promise<BooruPost[]>;
  /** Search for tags (autocomplete) */
  searchTags(query: string): Promise<SearchResults[]>;
  /** Formats a tag based on artist type (e.g. adding 'user:' prefix) */
  formatTag(tag: string, type: "tag" | "uploader" | "query"): string;
}

