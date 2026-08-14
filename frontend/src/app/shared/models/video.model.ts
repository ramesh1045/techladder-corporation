export interface Category {
  id: number;
  name: string;
  slug: string;
  videoCount?: number;
}

export interface Video {
  id: number;
  title: string;
  clientName: string;
  description: string | null;
  category: Category | null;
  campaignType: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  featured: boolean;
  createdAt: string;
  status?: 'draft' | 'published';
  updatedAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VideoListResponse {
  success: boolean;
  videos: Video[];
  pagination: Pagination;
}

export interface AdminVideoListResponse {
  success: boolean;
  videos: Video[];
  stats: {
    total: number;
    published: number;
    draft: number;
    featured: number;
  };
}

export interface VideoDetailResponse {
  success: boolean;
  video: Video;
  related: Video[];
}
