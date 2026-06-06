import { getHotspotBySlug, type HotspotItem } from "@/data/hotspots";
import { routeCoverImages } from "@/data/route-cover-images";

export type RouteStatus = "published" | "pending" | "draft";

export type RouteStop = {
  hotspotSlug: string;
  dwellTime: string;
  checkpoint: string;
  note: string;
};

export type CuratorRoute = {
  slug: string;
  title: string;
  subtitle: string;
  coverImage: string;
  theme: string;
  difficulty: string;
  status: RouteStatus;
  statusLabel: string;
  distanceKm: number;
  durationMinutes: number;
  completion: number;
  dropoff: number;
  author: string;
  date: string;
  updatedAt: string;
  overview: string;
  storyline: string;
  audience: string;
  bestTime: string;
  pace: string;
  districtSpan: string;
  startPoint: string;
  endPoint: string;
  tags: string[];
  highlights: string[];
  editorialNote: string;
  moderationNote: string;
  starts: string;
  finishes: string;
  saves: string;
  stops: RouteStop[];
  hotspotCount: number;
  images: string[];
};

export type ResolvedRouteStop = RouteStop & {
  index: number;
  hotspot: HotspotItem;
};

type RouteSeed = Omit<CuratorRoute, "hotspotCount" | "images">;

const routeSeeds: RouteSeed[] = [
  {
    slug: "sai-gon-100-nam-kien-truc",
    title: "Sài Gòn 100 năm kiến trúc",
    subtitle: "Chủ đề văn hoá · Dễ",
    coverImage: routeCoverImages["sai-gon-100-nam-kien-truc"],
    theme: "Chủ đề văn hoá",
    difficulty: "Dễ",
    status: "published",
    statusLabel: "Đã xuất bản",
    distanceKm: 2.4,
    durationMinutes: 95,
    completion: 78,
    dropoff: 12,
    author: "Lan Anh",
    date: "18/5/2025",
    updatedAt: "25/5/2025",
    overview:
      "Tuyến đi bộ nội đô kết nối ba công trình biểu tượng để kể câu chuyện về cách kiến trúc thuộc địa, tôn giáo và dân sự cùng định hình bản sắc trung tâm Sài Gòn.",
    storyline:
      "Mở tuyến bằng trục quảng trường Công xã Paris, sau đó đi sâu vào lớp không gian công cộng và kết thúc ở công trình bưu chính như một điểm chốt về nhịp sống đô thị.",
    audience: "Khách mới đến TP.HCM, nhóm gia đình và tour học sinh.",
    bestTime: "07:30 - 10:00",
    pace: "Đi bộ nhẹ, dừng chụp ảnh ngắn tại mỗi điểm.",
    districtSpan: "Quận 1",
    startPoint: "Nhà thờ Đức Bà Sài Gòn",
    endPoint: "Bưu điện Trung tâm",
    tags: ["#kientruc", "#noido", "#tourdibo"],
    highlights: [
      "Cấu trúc tuyến ngắn, dễ điều hướng và phù hợp cho phiên tham quan dưới 2 giờ.",
      "Ba hotspot nằm gần nhau nên tỷ lệ hoàn thành cao hơn các tuyến cùng chủ đề.",
      "Có thể mở rộng thêm Chợ Bến Thành nếu cần bản dài hơn cho cuối tuần.",
    ],
    editorialNote:
      "Nội dung đang cân bằng tốt giữa giá trị ảnh đẹp và chiều sâu kể chuyện, phù hợp làm tuyến đề xuất đầu tiên cho màn curator.",
    moderationNote:
      "Cần theo dõi tiến độ trùng tu của Nhà thờ Đức Bà để điều chỉnh câu mô tả ở checkpoint mở đầu khi cần.",
    starts: "1.420",
    finishes: "1.108",
    saves: "386",
    stops: [
      {
        hotspotSlug: "nha-tho-duc-ba-sai-gon",
        dwellTime: "25 phút",
        checkpoint: "Mở cảnh",
        note:
          "Giới thiệu lớp kiến trúc tôn giáo và trục quảng trường mở đầu tuyến.",
      },
      {
        hotspotSlug: "buu-dien-trung-tam",
        dwellTime: "20 phút",
        checkpoint: "Điểm nối",
        note:
          "Chuyển câu chuyện sang nhịp đô thị và hạ tầng công cộng thời thuộc địa.",
      },
      {
        hotspotSlug: "cho-ben-thanh",
        dwellTime: "30 phút",
        checkpoint: "Kết tuyến",
        note:
          "Khóa tuyến bằng nhịp sống thương mại và yếu tố văn hóa đại chúng của Sài Gòn.",
      },
    ],
  },
  {
    slug: "hanh-trinh-30-4",
    title: "Hành trình 30/4",
    subtitle: "Dòng thời gian lịch sử · Vừa",
    coverImage: routeCoverImages["hanh-trinh-30-4"],
    theme: "Dòng thời gian lịch sử",
    difficulty: "Vừa",
    status: "published",
    statusLabel: "Đã xuất bản",
    distanceKm: 3.1,
    durationMinutes: 120,
    completion: 64,
    dropoff: 22,
    author: "Thu Hà",
    date: "19/5/2025",
    updatedAt: "26/5/2025",
    overview:
      "Tuyến theo dòng thời gian tập trung vào những điểm chạm lịch sử trung tâm, giúp người dùng đi từ dấu mốc quyền lực, ký ức chiến tranh đến không gian công cộng sau ngày thống nhất.",
    storyline:
      "Câu chuyện đi từ Dinh Độc Lập, mở rộng sang lớp ký ức chiến tranh và kết ở trục đi bộ hiện đại để nối quá khứ với thành phố hôm nay.",
    audience: "Nhóm học sinh, khách quốc tế và người dùng thích tuyến kể chuyện.",
    bestTime: "08:00 - 11:30",
    pace: "Đi bộ kết hợp nghỉ sâu tại bảo tàng.",
    districtSpan: "Quận 1 - Quận 3",
    startPoint: "Dinh Độc Lập",
    endPoint: "Phố đi bộ Nguyễn Huệ",
    tags: ["#lichsu", "#304", "#storyroute"],
    highlights: [
      "Điểm mở đầu và cao trào đều có sức nặng lịch sử rõ ràng.",
      "Tuyến phù hợp để lồng audio guide hoặc clip ngắn theo từng mốc thời gian.",
      "Cần phân phối nhịp nghỉ hợp lý vì đoạn giữa tuyến có mật độ nội dung cao.",
    ],
    editorialNote:
      "Đây là tuyến có khả năng kể chuyện tốt nhất trong bộ mock hiện tại, đặc biệt khi muốn trình diễn logic sắp xếp theo dòng thời gian.",
    moderationNote:
      "Nên kiểm tra lại độ dài mô tả tại Bảo tàng Chứng tích Chiến tranh để tránh quá tải đọc trên mobile.",
    starts: "1.860",
    finishes: "1.190",
    saves: "512",
    stops: [
      {
        hotspotSlug: "dinh-doc-lap",
        dwellTime: "35 phút",
        checkpoint: "Khởi đầu",
        note:
          "Mốc mở tuyến với giá trị biểu tượng mạnh, phù hợp giới thiệu toàn bộ bối cảnh lịch sử.",
      },
      {
        hotspotSlug: "bao-tang-chung-tich-chien-tranh",
        dwellTime: "45 phút",
        checkpoint: "Cao trào",
        note:
          "Đào sâu trải nghiệm tư liệu và cảm xúc, tạo chiều nặng cho phần giữa tuyến.",
      },
      {
        hotspotSlug: "pho-di-bo-nguyen-hue",
        dwellTime: "20 phút",
        checkpoint: "Hạ nhịp",
        note:
          "Đưa người dùng trở lại nhịp sống đương đại, khép lại hành trình bằng không gian mở.",
      },
    ],
  },
  {
    slug: "cu-chi-long-dat-bat-khuat",
    title: "Củ Chi - Lòng đất bất khuất",
    subtitle: "Hành trình nhân vật · Khó",
    coverImage: routeCoverImages["cu-chi-long-dat-bat-khuat"],
    theme: "Hành trình nhân vật",
    difficulty: "Khó",
    status: "pending",
    statusLabel: "Chờ duyệt",
    distanceKm: 38,
    durationMinutes: 420,
    completion: 0,
    dropoff: 0,
    author: "Thu Hà",
    date: "12/5/2025",
    updatedAt: "22/5/2025",
    overview:
      "Tuyến nửa ngày dành cho người dùng muốn đào sâu trải nghiệm chiến tranh, nối không gian trưng bày trung tâm với thực địa địa đạo Củ Chi.",
    storyline:
      "Mở bằng tư liệu chiến tranh để tạo ngữ cảnh, sau đó đẩy người dùng đến trải nghiệm thực địa như phần cao trào của tuyến.",
    audience: "Tour học thuật, nhóm trường học và khách có quỹ thời gian dài.",
    bestTime: "07:30 - 14:00",
    pace: "Di chuyển xa, cần chuẩn bị xe và các khoảng nghỉ rõ ràng.",
    districtSpan: "Quận 3 - Huyện Củ Chi",
    startPoint: "Bảo tàng Chứng tích Chiến tranh",
    endPoint: "Địa đạo Củ Chi",
    tags: ["#chientranh", "#cuchi", "#tourngaydai"],
    highlights: [
      "Khoảng cách lớn nhưng chiều sâu trải nghiệm mạnh, phù hợp tuyến chuyên đề.",
      "Phần cuối tuyến có tính nhập vai cao hơn hẳn các route nội đô.",
      "Cần kiểm soát kỳ vọng người dùng từ đầu vì thời lượng dài và cường độ cao.",
    ],
    editorialNote:
      "Nội dung có tiềm năng tốt nhưng cần thêm điểm nghỉ và hướng dẫn chuẩn bị trước khi đủ điều kiện duyệt.",
    moderationNote:
      "Thiếu một checkpoint trung gian cho đoạn chuyển từ trung tâm ra Củ Chi, hiện đây là lý do chính khiến tuyến đang ở trạng thái chờ duyệt.",
    starts: "294",
    finishes: "0",
    saves: "178",
    stops: [
      {
        hotspotSlug: "bao-tang-chung-tich-chien-tranh",
        dwellTime: "50 phút",
        checkpoint: "Ngữ cảnh",
        note:
          "Thiết lập lớp tư liệu trước khi người dùng bước vào trải nghiệm thực địa.",
      },
      {
        hotspotSlug: "dia-dao-cu-chi",
        dwellTime: "140 phút",
        checkpoint: "Cao trào",
        note:
          "Toàn bộ phần nhập vai và hiểu không gian ngầm diễn ra ở checkpoint này.",
      },
    ],
  },
  {
    slug: "tam-linh-sai-gon",
    title: "Tâm linh Sài Gòn",
    subtitle: "Tối ưu địa lý · Dễ",
    coverImage: routeCoverImages["tam-linh-sai-gon"],
    theme: "Tối ưu địa lý",
    difficulty: "Dễ",
    status: "draft",
    statusLabel: "Bản nháp",
    distanceKm: 1.8,
    durationMinutes: 70,
    completion: 0,
    dropoff: 0,
    author: "Minh Quân",
    date: "17/5/2025",
    updatedAt: "19/5/2025",
    overview:
      "Bản nháp tuyến ngắn xoay quanh các công trình tôn giáo và điểm dừng văn hóa, hướng tới trải nghiệm tĩnh hơn ở khu vực trung tâm.",
    storyline:
      "Tuyến dự kiến dẫn người dùng từ không gian tín ngưỡng quy mô lớn đến lớp kiến trúc nhà thờ, tạo đối thoại giữa các hình thức tôn giáo trong đô thị.",
    audience: "Người dùng đi bộ tự do, nhóm nhỏ và tuyến cuối tuần ngắn.",
    bestTime: "06:30 - 09:00",
    pace: "Đi chậm, ưu tiên không gian yên tĩnh và khoảng nghỉ quan sát.",
    districtSpan: "Quận 1 - Quận 3",
    startPoint: "Chùa Vĩnh Nghiêm",
    endPoint: "Nhà thờ Đức Bà Sài Gòn",
    tags: ["#tamlinh", "#dibongan", "#kientructongiao"],
    highlights: [
      "Khoảng cách ngắn, dễ chuyển thành tuyến khám phá buổi sáng.",
      "Chủ đề rõ nhưng cần tinh chỉnh lại chất lượng hotspot mở đầu.",
      "Có thể nối thêm Bưu điện Trung tâm nếu muốn kết tuyến ở lớp kiến trúc công cộng.",
    ],
    editorialNote:
      "Route đang ở dạng bản nháp vì checkpoint đầu tuyến chưa đạt chất lượng nội dung lẫn trạng thái hotspot.",
    moderationNote:
      "Cần thay hoặc sửa hotspot Chùa Vĩnh Nghiêm trước khi route có thể sang bước gửi duyệt.",
    starts: "86",
    finishes: "0",
    saves: "54",
    stops: [
      {
        hotspotSlug: "chua-vinh-nghiem",
        dwellTime: "30 phút",
        checkpoint: "Khởi đầu",
        note:
          "Tạo không khí tĩnh và mở chủ đề tín ngưỡng trong đô thị hiện đại.",
      },
      {
        hotspotSlug: "nha-tho-duc-ba-sai-gon",
        dwellTime: "25 phút",
        checkpoint: "Đối chiếu",
        note:
          "Khép tuyến bằng đối thoại kiến trúc và nhịp công cộng trung tâm.",
      },
    ],
  },
];

function buildRouteImages(stops: RouteStop[]) {
  return stops
    .map((stop) => getHotspotBySlug(stop.hotspotSlug)?.image)
    .filter((image): image is string => Boolean(image))
    .slice(0, 3);
}

export const routeStatusClasses: Record<RouteStatus, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  draft: "border-slate-200 bg-slate-100 text-slate-600",
};

export const curatorRoutes: CuratorRoute[] = routeSeeds.map((route) => ({
  ...route,
  hotspotCount: route.stops.length,
  images: buildRouteImages(route.stops),
}));

export function getCuratorRouteBySlug(slug: string) {
  return curatorRoutes.find((route) => route.slug === slug) ?? null;
}

export function getResolvedRouteStops(route: CuratorRoute): ResolvedRouteStop[] {
  return route.stops
    .map((stop, index) => {
      const hotspot = getHotspotBySlug(stop.hotspotSlug);

      if (!hotspot) {
        return null;
      }

      return {
        ...stop,
        index: index + 1,
        hotspot,
      };
    })
    .filter((stop): stop is ResolvedRouteStop => Boolean(stop));
}
