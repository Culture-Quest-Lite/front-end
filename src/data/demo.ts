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
  details?: string;
}

export const audit: AuditEntry[] = [
  {
    id: "audit-1",
    who: "Nguyễn Văn A",
    action: "Duyệt",
    target: "Hotspot lịch sử Nhà thờ Đức Bà",
    at: "2026-05-29T08:45:00Z",
    details:
      "Nội dung được xác nhận phù hợp, không phát hiện thông tin nhạy cảm hoặc sai sự kiện lịch sử.",
  },
  {
    id: "audit-2",
    who: "Lê Thị B",
    action: "Từ chối",
    target: "Câu chuyện về chiếc xe cổ",
    at: "2026-05-30T14:15:00Z",
    before: "Nội dung không chính xác",
    after: "Nội dung đã được cập nhật",
    details:
      "Kiểm duyệt viên yêu cầu sửa đổi phần năm sản xuất và nguồn gốc xe trước khi duyệt lại.",
  },
  {
    id: "audit-3",
    who: "Trần Minh C",
    action: "Khoá",
    target: "Tuyến tham quan đường sách",
    at: "2026-06-01T09:20:00Z",
    details:
      "Tuyến bị khoá tạm thời do phát hiện thông tin sai lệch về thời gian hoạt động.",
  },
  {
    id: "audit-4",
    who: "Phạm Thị D",
    action: "Chỉnh sửa",
    target: "Hotspot ẩm thực Bến Thành",
    at: "2026-06-02T13:50:00Z",
    before: "Giờ mở cửa: 7:00-22:00",
    after: "Giờ mở cửa: 6:00-23:00",
    details:
      "Dữ liệu mở cửa đã được cập nhật theo thông tin mới từ ban quản lý khu ẩm thực.",
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
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    role: "Admin",
    status: "Hoạt động",
    checkins: 45,
  },
  {
    id: "user-2",
    name: "Lê Thị B",
    email: "lethib@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    role: "Curator",
    status: "Hoạt động",
    checkins: 32,
  },
  {
    id: "user-3",
    name: "Trần Minh C",
    email: "tranminhc@example.com",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    role: "Curator",
    status: "Hoạt động",
    checkins: 28,
  },
  {
    id: "user-4",
    name: "Phạm Thị D",
    email: "phamthid@example.com",
    avatar:
      "https://images.unsplash.com/photo-1501746074465-4cebaf45b800?auto=format&fit=crop&w=100&q=80",
    role: "Explorer",
    status: "Bị khoá",
    checkins: 15,
  },
  {
    id: "user-5",
    name: "Hoàng Văn E",
    email: "hoangvane@example.com",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    role: "Explorer",
    status: "Đang xem xét",
    checkins: 8,
  },
  {
    id: "user-6",
    name: "Võ Thị F",
    email: "vothif@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    role: "Guest",
    status: "Hoạt động",
    checkins: 3,
  },
  {
    id: "user-7",
    name: "Đặng Văn G",
    email: "dangvang@example.com",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
    role: "Explorer",
    status: "Hoạt động",
    checkins: 22,
  },
  {
    id: "user-8",
    name: "Bùi Thị H",
    email: "buithih@example.com",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
    role: "Curator",
    status: "Hoạt động",
    checkins: 41,
  },
  {
    id: "user-9",
    name: "Ngô Văn I",
    email: "ngovani@example.com",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
    role: "Explorer",
    status: "Bị khoá",
    checkins: 5,
  },
  {
    id: "user-10",
    name: "Lý Thị K",
    email: "lythik@example.com",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    role: "Guest",
    status: "Hoạt động",
    checkins: 1,
  },
  {
    id: "user-11",
    name: "Mai Văn L",
    email: "maivanl@example.com",
    avatar:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=100&q=80",
    role: "Explorer",
    status: "Đang xem xét",
    checkins: 12,
  },
  {
    id: "user-12",
    name: "Trịnh Thị M",
    email: "trinhthim@example.com",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    role: "Curator",
    status: "Hoạt động",
    checkins: 36,
  },
  {
    id: "user-13",
    name: "Phan Văn N",
    email: "phanvann@example.com",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    role: "Explorer",
    status: "Hoạt động",
    checkins: 19,
  },
  {
    id: "user-14",
    name: "Đỗ Thị O",
    email: "dothio@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    role: "Guest",
    status: "Hoạt động",
    checkins: 0,
  },
  {
    id: "user-15",
    name: "Hồ Văn P",
    email: "hovanp@example.com",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    role: "Admin",
    status: "Hoạt động",
    checkins: 67,
  },
];

export type SubscriptionStatus = "active" | "inactive" | "draft";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  status: SubscriptionStatus;
  subscribers: number;
  createdAt: string;
}

export const subscriptions: SubscriptionPlan[] = [
  {
    id: "sub-1",
    name: "Explorer Free",
    description: "Gói miễn phí cho người dùng mới khám phá văn hóa.",
    price: 0,
    currency: "VND",
    durationDays: 365,
    features: ["3 tuyến/tháng", "Check-in cơ bản", "Huy hiệu cơ bản"],
    status: "active",
    subscribers: 3840,
    createdAt: "2025-01-15T00:00:00Z",
  },
  {
    id: "sub-2",
    name: "Explorer Pro",
    description: "Trải nghiệm đầy đủ với tuyến không giới hạn và XP x2.",
    price: 99000,
    currency: "VND",
    durationDays: 30,
    features: ["Tuyến không giới hạn", "XP x2", "Huy hiệu độc quyền", "Ưu tiên hỗ trợ"],
    status: "active",
    subscribers: 412,
    createdAt: "2025-03-01T00:00:00Z",
  },
  {
    id: "sub-3",
    name: "Curator Plus",
    description: "Dành cho người quản lý nội dung với công cụ nâng cao.",
    price: 199000,
    currency: "VND",
    durationDays: 30,
    features: ["Phân tích nội dung", "Xuất bản ưu tiên", "Báo cáo chi tiết", "API truy cập"],
    status: "active",
    subscribers: 28,
    createdAt: "2025-04-10T00:00:00Z",
  },
  {
    id: "sub-4",
    name: "Enterprise",
    description: "Gói doanh nghiệp cho đối tác du lịch và bảo tàng.",
    price: 4990000,
    currency: "VND",
    durationDays: 365,
    features: ["White-label", "Quản lý đa tổ chức", "SLA 99.9%", "Tích hợp tùy chỉnh"],
    status: "draft",
    subscribers: 0,
    createdAt: "2026-05-20T00:00:00Z",
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
  {
    id: "rp1",
    type: "Bình luận",
    target: "Review của user_4821",
    reason: "Ngôn ngữ thô tục",
    reporter: "user_2210",
    at: "2025-05-21T08:11:00Z",
    status: "Mới",
  },
  {
    id: "rp2",
    type: "Hình ảnh",
    target: "Upload trong Chợ Bến Thành",
    reason: "Nội dung không phù hợp",
    reporter: "user_1109",
    at: "2025-05-20T19:42:00Z",
    status: "Đang xử lý",
  },
  {
    id: "rp3",
    type: "Tài khoản",
    target: "user_5520",
    reason: "Spam bình luận",
    reporter: "system",
    at: "2025-05-19T12:00:00Z",
    status: "Đã xử lý",
  },
];
export const hotspots = [
  {
    id: "h1",
    cover:
      "https://i.pinimg.com/736x/1d/0c/34/1d0c3486ffe197fd5907e37cf78966e1.jpg",
    name: "Công viên trung tâm",
    district: "Quận 1",
    xp: 1200,
  },
  {
    id: "h2",
    cover:
      "https://i.pinimg.com/1200x/90/50/c2/9050c27fee175aa36681e5feb283c817.jpg",
    name: "Bảo tàng thành phố",
    district: "Quận 3",
    xp: 980,
  },
  {
    id: "h3",
    cover:
      "https://i.pinimg.com/736x/4d/1f/b4/4d1fb43e52e4754cbfa20cc737cd89b7.jpg",
    name: "Khu phố cổ",
    district: "Quận 5",
    xp: 860,
  },
  {
    id: "h4",
    cover:
      "https://i.pinimg.com/736x/ff/70/48/ff70480a7e957aca0c446451318cce2d.jpg",
    name: "Công trình nghệ thuật",
    district: "Quận 7",
    xp: 745,
  },
];

export const approvals: ApprovalItem[] = [
  {
    id: "a1",
    thumbnail:
      "https://i.pinimg.com/1200x/91/62/f1/9162f1d87a84d588fba7c4f56d2db035.jpg",
    title: "Bưu điện Trung tâm - Đề xuất hotspot",
    type: "Hotspot",
    submittedAt: "2026-06-06T01:15:00Z",
    curator: "Minh Anh",
    status: "pending",
  },
  {
    id: "a2",
    thumbnail:
      "https://i.pinimg.com/736x/37/cf/ab/37cfabf80927932a39335f1eff259e75.jpg",
    title: "Story: Văn hoá đường phố Sài Gòn",
    type: "Story",
    submittedAt: "2026-06-06T03:40:00Z",
    curator: "Hương",
    status: "pending",
  },
  {
    id: "a3",
    thumbnail:
      "https://i.pinimg.com/736x/29/82/1b/29821b2eed1c7853752aeabde29ba9c9.jpg",
    title: "Cù Chi - Lòng đất bất khuất",
    type: "Route",
    curator: "Thu Hà",
    submittedAt: "2025-05-21T15:30:00.000Z",
    status: "pending",
  },
  {
    id: "a4",
    thumbnail:
      "https://i.pinimg.com/1200x/4d/cf/ee/4dcfeef50eb40863e663912c143d0cd2.jpg",
    title: "Lá thư từ Bưu điện trăm tuổi",
    type: "Story",
    curator: "Lan Anh",
    submittedAt: "2025-05-22T02:20:00.000Z",
    status: "approved",
  },
  {
    id: "a5",
    thumbnail:
      "https://i.pinimg.com/736x/3f/78/75/3f7875abd8c9c8ad5251fc54c2c74ef1.jpg",
    title: "Bảo tàng Chứng tích Chiến tranh - bài viết",
    type: "Hotspot",
    curator: "Thu Hà",
    submittedAt: "2025-05-21T16:40:00.000Z",
    status: "approved",
  },
  {
    id: "a6",
    thumbnail:
      "https://i.pinimg.com/736x/90/52/c4/9052c43e5062c3f2fa314d176f6bf82f.jpg",
    title: "Hành trình văn hóa đêm - Đề xuất tuyến mới",
    type: "Route",
    submittedAt: "2026-06-06T05:05:00Z",
    curator: "Thanh",
    status: "pending",
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
