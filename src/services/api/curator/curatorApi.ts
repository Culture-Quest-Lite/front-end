import { apiFetch } from "@/lib/api";
import type { TagUsageRecord } from "@/lib/tags";
import type { BackendStorySummary } from "@/services/api/storyApi";

/**
 * Dashboard của Curator — `GET /api/curator/dashboard`.
 *
 * Cùng quy ước với adminApi: các field viết tắt (`d`/`v`, `r`/`views`/
 * `completes`, `h`/`checkIns`) do backend `@JsonProperty` cho khớp thẳng với
 * `dataKey` của recharts, cắm vào chart không cần map lại.
 */
export interface CuratorRouteStatusCounts {
  draft: number;
  recording: number;
  onHold: number;
  trial: number;
  pending: number;
  published: number;
}

export interface CuratorContentSummary {
  publishedHotspots: number;
  draftHotspots: number;
  routeCounts: CuratorRouteStatusCounts;
  publishedStories: number;
  draftStories: number;
  totalCheckIns: number;
  /** `null` khi chưa có review nào. */
  averageRating: number | null;
  totalReviews: number;
}

export interface CuratorCheckInPoint {
  /** Nhãn thứ trong tuần: T2..T7, CN. */
  d: string;
  v: number;
  date: string;
}

export interface CuratorCheckInTrend {
  checkInsToday: number;
  checkInsYesterday: number;
  /** `null` khi hôm qua = 0 (không chia được), KHÔNG phải 0%. */
  changePercent: number | null;
  daily: CuratorCheckInPoint[];
}

export interface CuratorRouteEngagementPoint {
  routeId: number;
  r: string;
  /** Số lượt bắt đầu tuyến (RouteParticipant), không phải lượt xem. */
  views: number;
  completes: number;
  completionRate: number | null;
}

export interface CuratorTopHotspotPoint {
  hotspotId: number;
  h: string;
  checkIns: number;
  averageRating: number | null;
  totalReviews: number;
}

export interface CuratorTopContent {
  topRoutes: CuratorRouteEngagementPoint[];
  topHotspots: CuratorTopHotspotPoint[];
}

export interface CuratorDashboard {
  contentSummary: CuratorContentSummary;
  checkInTrend: CuratorCheckInTrend;
  topContent: CuratorTopContent;
}

export interface CuratorPendingTag {
  tagId: number;
  tagName: string;
  imageUrl?: string | null;
  tagStatus: string;
  routeCount: number | null;
  hotspotCount: number | null;
  storyCount: number | null;
  cultureScore?: number | null;
  cultureReason?: string | null;
  rejectReason?: string | null;
  createdAt: string;
  updatedAt: string;
  usages?: TagUsageRecord[] | null;
}

export interface CuratorPendingStory extends BackendStorySummary {
  storyId: number;
}

export interface CuratorPendingContent {
  tags: CuratorPendingTag[];
  stories: CuratorPendingStory[];
}

function curatorPath(path: string) {
  return `/api/curator${path}`;
}

export const curatorApi = {
  getDashboard: async () => {
    return apiFetch<CuratorDashboard>(curatorPath("/dashboard"), {
      method: "GET",
      sameOrigin: true,
    });
  },

  getPendingContent: async () => {
    return apiFetch<CuratorPendingContent>(curatorPath("/content/pending"), {
      method: "GET",
      sameOrigin: true,
    });
  },
};

export default curatorApi;
