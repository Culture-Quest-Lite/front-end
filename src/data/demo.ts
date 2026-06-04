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
