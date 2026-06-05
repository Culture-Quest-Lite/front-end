export type ApprovalType = "Hotspot" | "Story" | "Route";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  thumbnail: string;
  submittedAt: string;
  curator: string;
  status: ApprovalStatus;
}

export const approvals: ApprovalItem[] = [
  {
    id: "approval-1",
    type: "Hotspot",
    title: "Hotspot lịch sử Nhà thờ Đức Bà",
    thumbnail: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
    submittedAt: "2026-05-29T08:45:00Z",
    curator: "Nguyễn Văn A",
    status: "pending",
  },
  {
    id: "approval-2",
    type: "Story",
    title: "Câu chuyện về chiếc xe cổ trên đường Lê Duẩn",
    thumbnail: "https://images.unsplash.com/photo-1491396060180-4b695e8ee73f?auto=format&fit=crop&w=800&q=80",
    submittedAt: "2026-05-30T14:15:00Z",
    curator: "Lê Thị B",
    status: "pending",
  },
  {
    id: "approval-3",
    type: "Route",
    title: "Tuyến tham quan đường sách Nguyễn Văn Bình",
    thumbnail: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    submittedAt: "2026-06-01T09:20:00Z",
    curator: "Trần Minh C",
    status: "pending",
  },
  {
    id: "approval-4",
    type: "Hotspot",
    title: "Hotspot ẩm thực truyền thống tại chợ Bến Thành",
    thumbnail: "https://images.unsplash.com/photo-1514516870924-5f4d9ca03540?auto=format&fit=crop&w=800&q=80",
    submittedAt: "2026-06-02T13:50:00Z",
    curator: "Phạm Thị D",
    status: "pending",
  },
];

export interface AuditEntry {
  id: string;
  who: string;
  action: string;
  target: string;
  at: string;
  before?: string;
  after?: string;
}

export const audit: AuditEntry[] = [
  {
    id: "audit-1",
    who: "Nguyễn Văn A",
    action: "Duyệt",
    target: "Hotspot lịch sử Nhà thờ Đức Bà",
    at: "2026-05-29T08:45:00Z",
  },
  {
    id: "audit-2",
    who: "Lê Thị B",
    action: "Từ chối",
    target: "Câu chuyện về chiếc xe cổ",
    at: "2026-05-30T14:15:00Z",
    before: "Nội dung không chính xác",
    after: "Nội dung đã được cập nhật",
  },
  {
    id: "audit-3",
    who: "Trần Minh C",
    action: "Khoá",
    target: "Tuyến tham quan đường sách",
    at: "2026-06-01T09:20:00Z",
  },
  {
    id: "audit-4",
    who: "Phạm Thị D",
    action: "Chỉnh sửa",
    target: "Hotspot ẩm thực Bến Thành",
    at: "2026-06-02T13:50:00Z",
    before: "Giờ mở cửa: 7:00-22:00",
    after: "Giờ mở cửa: 6:00-23:00",
  },
];

export type UserRole = "Admin" | "Curator" | "Explorer" | "Guest";
export type UserStatus = "Hoạt động" | "Bị khoá" | "Đang xem xét";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  checkins: number;
}

export const users: User[] = [
  {
    id: "user-1",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    role: "Admin",
    status: "Hoạt động",
    checkins: 45,
  },
  {
    id: "user-2",
    name: "Lê Thị B",
    email: "lethib@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    role: "Curator",
    status: "Hoạt động",
    checkins: 32,
  },
  {
    id: "user-3",
    name: "Trần Minh C",
    email: "tranminhc@example.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    role: "Curator",
    status: "Hoạt động",
    checkins: 28,
  },
  {
    id: "user-4",
    name: "Phạm Thị D",
    email: "phamthid@example.com",
    avatar: "https://images.unsplash.com/photo-1501746074465-4cebaf45b800?auto=format&fit=crop&w=100&q=80",
    role: "Explorer",
    status: "Bị khoá",
    checkins: 15,
  },
  {
    id: "user-5",
    name: "Hoàng Văn E",
    email: "hoangvane@example.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    role: "Explorer",
    status: "Đang xem xét",
    checkins: 8,
  },
  {
    id: "user-6",
    name: "Võ Thị F",
    email: "vothif@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    role: "Guest",
    status: "Hoạt động",
    checkins: 3,
  },
];
export const checkinsTrend = [
  { d: "T2", v: 412 }, { d: "T3", v: 530 }, { d: "T4", v: 489 },
  { d: "T5", v: 612 }, { d: "T6", v: 798 }, { d: "T7", v: 945 }, { d: "CN", v: 1024 },
];
export const userGrowth = [
  { m: "T1", u: 1200 }, { m: "T2", u: 1810 }, { m: "T3", u: 2400 },
  { m: "T4", u: 3120 }, { m: "T5", u: 4280 },
];
export const routeEngagement = [
  { r: "100 năm KT", views: 4200, completes: 3276 },
  { r: "Hành trình 30/4", views: 3100, completes: 1984 },
  { r: "Củ Chi", views: 2200, completes: 1408 },
  { r: "Tâm linh SG", views: 1500, completes: 980 },
];
export const funnel = [
  { stage: "Xem tuyến", v: 10000 },
  { stage: "Bắt đầu", v: 6400 },
  { stage: "Check-in đầu", v: 4900 },
  { stage: "Giữa tuyến", v: 3100 },
  { stage: "Hoàn thành", v: 2150 },
];

export const reports = [
  { id: "rp1", type: "Bình luận", target: "Review của user_4821", reason: "Ngôn ngữ thô tục", reporter: "user_2210", at: "2025-05-21T08:11:00Z", status: "Mới" },
  { id: "rp2", type: "Hình ảnh", target: "Upload trong Chợ Bến Thành", reason: "Nội dung không phù hợp", reporter: "user_1109", at: "2025-05-20T19:42:00Z", status: "Đang xử lý" },
  { id: "rp3", type: "Tài khoản", target: "user_5520", reason: "Spam bình luận", reporter: "system", at: "2025-05-19T12:00:00Z", status: "Đã xử lý" },
];