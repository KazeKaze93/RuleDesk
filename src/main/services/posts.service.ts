import { eq, count, desc, and, like } from "drizzle-orm";
import { getDatabase } from "../db";
import { posts } from "../db/schema";
import type { Post } from "../db/schema";

export type PostUpdateChanges = {
  rating?: string;
  tags?: string;
  title?: string;
  isViewed?: boolean;
  isFavorited?: boolean;
  fileUrl?: string;
  previewUrl?: string;
  sampleUrl?: string;
};

export type GetPostsParams = {
  artistId?: number;
  limit: number;
  offset: number;
  filters?: {
    tags?: string;
    rating?: "s" | "q" | "e";
    isFavorited?: boolean;
    isViewed?: boolean;
  };
};

export class PostsService {
  private get db() {
    return getDatabase();
  }

  async getPosts(params: GetPostsParams) {
    const conditions = [];

    if (params.artistId) {
      conditions.push(eq(posts.artistId, params.artistId));
    }

    if (params.filters) {
      if (params.filters.tags) {
        conditions.push(like(posts.tags, `%${params.filters.tags}%`));
      }
      if (params.filters.rating) {
        conditions.push(eq(posts.rating, params.filters.rating));
      }
      if (params.filters.isFavorited !== undefined) {
        conditions.push(eq(posts.isFavorited, params.filters.isFavorited));
      }
      if (params.filters.isViewed !== undefined) {
        conditions.push(eq(posts.isViewed, params.filters.isViewed));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(posts)
      .where(whereClause)
      .orderBy(desc(posts.publishedAt))
      .limit(params.limit)
      .offset(params.offset);
  }

  async toggleFavorite(postId: number): Promise<boolean> {
    const db = getDatabase();

    // 1. Получаем текущий статус (только нужное поле)
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: {
        isFavorited: true,
      },
    });

    if (!post) throw new Error(`Post ${postId} not found`);

    const newState = !post.isFavorited;

    // 2. Обновляем статус
    await db
      .update(posts)
      .set({ isFavorited: newState })
      .where(eq(posts.id, postId))
      .run();

    return newState;
  }

  async getPostsCount(
    params: Omit<GetPostsParams, "limit" | "offset">
  ): Promise<number> {
    try {
      const conditions = [];

      if (params.artistId) conditions.push(eq(posts.artistId, params.artistId));

      if (params.filters) {
        if (params.filters.tags)
          conditions.push(like(posts.tags, `%${params.filters.tags}%`));
        if (params.filters.rating)
          conditions.push(eq(posts.rating, params.filters.rating));
        if (params.filters.isFavorited !== undefined)
          conditions.push(eq(posts.isFavorited, params.filters.isFavorited));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const result = await this.db
        .select({ count: count() })
        .from(posts)
        .where(whereClause);

      return result[0]?.count ?? 0;
    } catch (error) {
      console.error("Failed to get posts count:", error);
      return 0;
    }
  }

  async getPostById(postId: number): Promise<Post | null> {
    const result = await this.db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return (result[0] as Post) ?? null;
  }

  async updatePost(
    postId: number,
    changes: PostUpdateChanges
  ): Promise<boolean> {
    const updateData: Partial<typeof posts.$inferInsert> = {};

    if (changes.rating !== undefined) updateData.rating = changes.rating;
    if (changes.tags !== undefined) updateData.tags = changes.tags;
    if (changes.title !== undefined) updateData.title = changes.title;
    if (changes.fileUrl !== undefined) updateData.fileUrl = changes.fileUrl;
    if (changes.previewUrl !== undefined)
      updateData.previewUrl = changes.previewUrl;
    if (changes.sampleUrl !== undefined)
      updateData.sampleUrl = changes.sampleUrl;
    if (changes.isViewed !== undefined) updateData.isViewed = changes.isViewed;
    if (changes.isFavorited !== undefined)
      updateData.isFavorited = changes.isFavorited;

    if (Object.keys(updateData).length === 0) return false;

    const result = await this.db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, postId))
      .run();

    return result.changes > 0;
  }

  async resetPostCache(postId: number): Promise<boolean> {
    return this.updatePost(postId, { isViewed: false });
  }
}
