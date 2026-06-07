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
  {
    id: "audit-5",
    who: "Nguyễn Thị E",
    action: "Duyệt",
    target: "Review phố đi bộ Nguyễn Huệ",
    at: "2026-06-03T11:05:00Z",
  },
  {
    id: "audit-6",
    who: "Hoàng Văn F",
    action: "Chỉnh sửa",
    target: "Mô tả tuyến ẩm thực đường phố",
    at: "2026-06-03T14:40:00Z",
    before: "Thời lượng 120 phút",
    after: "Thời lượng 90 phút",
  },
  {
    id: "audit-7",
    who: "Phạm Thị G",
    action: "Từ chối",
    target: "Bài viết hướng dẫn check-in Vincom",
    at: "2026-06-04T09:25:00Z",
    before: "Chứa thông tin sai lệch",
    after: "Đang chờ sửa đổi",
  },
  {
    id: "audit-8",
    who: "Võ Minh H",
    action: "Duyệt",
    target: "Story lịch sử Chợ Bến Thành",
    at: "2026-06-04T16:10:00Z",
  },
  {
    id: "audit-9",
    who: "Lê Văn I",
    action: "Khoá",
    target: "Tài khoản user_7902",
    at: "2026-06-05T10:50:00Z",
  },
  {
    id: "audit-10",
    who: "Trần Thị J",
    action: "Chỉnh sửa",
    target: "Thông tin hotspot Nghệ thuật đường phố",
    at: "2026-06-05T12:30:00Z",
    before: "Thêm địa chỉ sai",
    after: "Sửa lại địa chỉ chính xác",
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
export const hotspots = [
  {
    id: "h1",
    cover:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    name: "Công viên trung tâm",
    district: "Quận 1",
    xp: 1200,
  },
  {
    id: "h2",
    cover:
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=800&q=80",
    name: "Bảo tàng thành phố",
    district: "Quận 3",
    xp: 980,
  },
  {
    id: "h3",
    cover:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    name: "Khu phố cổ",
    district: "Quận 5",
    xp: 860,
  },
  {
    id: "h4",
    cover:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80",
    name: "Công trình nghệ thuật",
    district: "Quận 7",
    xp: 745,
  },
];

export const approvals = [
  {
    id: "a1",
    thumbnail:
      "https://images.unsplash.com/photo-1518733057094-95b53169d5af?auto=format&fit=crop&w=400&q=80",
    title: "Bưu điện Trung tâm - Đề xuất hotspot",
    type: "Hotspot",
    curator: "Lan Anh",
    submittedAt: "2025-05-21T11:00:00.000Z",
    status: "pending",
  },
  {
    id: "a2",
    thumbnail:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80",
    title: "Story: Văn hoá đường phố Sài Gòn",
    type: "Story",
    curator: "Thu Hà",
    submittedAt: "2025-05-21T16:40:00.000Z",
    status: "pending",
  },
  {
    id: "a3",
    thumbnail:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
    title: "Cù Chi - Lòng đất bất khuất",
    type: "Route",
    curator: "Thu Hà",
    submittedAt: "2025-05-21T15:30:00.000Z",
    status: "pending",
  },
  {
    id: "a4",
    thumbnail:
      "https://images.unsplash.com/photo-1533777324565-a040eb52fac2?auto=format&fit=crop&w=400&q=80",
    title: "Lá thư từ Bưu điện trăm tuổi",
    type: "Story",
    curator: "Lan Anh",
    submittedAt: "2025-05-22T02:20:00.000Z",
    status: "approved",
  },
  {
    id: "a5",
    thumbnail:
      "https://images.unsplash.com/photo-1511763368359-5f6d7a4a1b3c?auto=format&fit=crop&w=400&q=80",
    title: "Bảo tàng Chứng tích Chiến tranh - bài viết",
    type: "Hotspot",
    curator: "Thu Hà",
    submittedAt: "2025-05-21T16:40:00.000Z",
    status: "approved",
  },
  {
    id: "a6",
    thumbnail:
      "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=400&q=80",
    title: "Hành trình văn hóa đêm - Đề xuất tuyến mới",
    type: "Route",
    curator: "Thanh",
    submittedAt: "2025-05-23T09:15:00.000Z",
    status: "rejected",
  },
] as const;

export const checkinsTrend = [
  { d: "T2", v: 520 },
  { d: "T3", v: 690 },
  { d: "T4", v: 570 },
  { d: "T5", v: 820 },
  { d: "T6", v: 740 },
  { d: "T7", v: 920 },
  { d: "CN", v: 1080 },
];

export const userGrowth = [
  { m: "Thg 1", u: 420 },
  { m: "Thg 2", u: 510 },
  { m: "Thg 3", u: 630 },
  { m: "Thg 4", u: 720 },
  { m: "Thg 5", u: 840 },
  { m: "Thg 6", u: 950 },
  { m: "Thg 7", u: 1100 },
];

export const routeEngagement = [
  { r: "Bến Nhà Rồng", views: 340, completes: 120 },
  { r: "Phố đi bộ", views: 280, completes: 94 },
  { r: "Khu công nghệ", views: 220, completes: 80 },
  { r: "Vườn hoa", views: 180, completes: 72 },
];
