export type HotspotItem = {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  address: string;
  description: string;
  category: string;
  relatedTopics: string[];
  videoLabel?: string;
  videoUrl?: string;
  xp: string;
  status: string;
  statusStyle: string;
  badge: string;
  gps: string;
  image: string;
  tags: string[];
};

export type HotspotProfile = {
  coordinates: string;
  district: string;
  estimatedVisit: string;
  bestTime: string;
  accessibility: string;
  lastUpdated: string;
  factSheet: string[];
  editorialNote: string;
  preservationNote: string;
  stats: {
    checkIns: string;
    saves: string;
    routes: string;
  };
};

export const hotspotItems: HotspotItem[] = [
  {
    slug: "dinh-doc-lap",
    title: "Dinh Độc Lập",
    subtitle: "Di tích lịch sử · Quận 1",
    author: "Lan Anh",
    date: "19/5/2025",
    address: "135 Nam Kỳ Khởi Nghĩa, Bến Thành, Quận 1, TP.HCM",
    description:
      "Di tích quốc gia đặc biệt gắn với nhiều dấu mốc lịch sử hiện đại của Việt Nam, nổi bật với kiến trúc những năm 1960 và hệ thống phòng trưng bày còn được bảo tồn gần nguyên trạng.",
    category: "Lịch sử",
    relatedTopics: ["Hành trình 30/4", "Sài Gòn 100 năm kiến trúc"],
    videoLabel: "Video giới thiệu · 01:48",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    xp: "120 XP",
    status: "Đã xuất bản",
    statusStyle: "bg-emerald-600/95 text-white",
    badge: "Đã xuất bản",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/736x/3c/a8/e5/3ca8e5490a9f40f4aecf98b3c6e3da21.jpg",
    tags: ["#lichsu", "#kientruc", "#disan"],
  },
  {
    slug: "nha-tho-duc-ba-sai-gon",
    title: "Nhà thờ Đức Bà Sài Gòn",
    subtitle: "Kiến trúc tôn giáo · Quận 1",
    author: "Minh Quân",
    date: "20/5/2025",
    address: "01 Công xã Paris, Bến Nghé, Quận 1, TP.HCM",
    description:
      "Công trình kiến trúc Romanesque pha Gothic tiêu biểu của Sài Gòn cuối thế kỷ 19, nổi bật với mặt đứng gạch đỏ, tháp chuông đôi và quảng trường Công xã Paris phía trước.",
    category: "Kiến trúc",
    relatedTopics: ["Sài Gòn 100 năm kiến trúc"],
    videoLabel: "Video giới thiệu · 01:12",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    xp: "100 XP",
    status: "Đã xuất bản",
    statusStyle: "bg-emerald-500/10 text-emerald-700",
    badge: "Đã xuất bản",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/1200x/bb/60/0a/bb600aeb686197a007961a91b2035f37.jpg",
    tags: ["#kientruc", "#vanhoa"],
  },
  {
    slug: "buu-dien-trung-tam",
    title: "Bưu điện Trung tâm",
    subtitle: "Kiến trúc · Quận 1",
    author: "Lan Anh",
    date: "21/5/2025",
    address: "2 Công xã Paris, Bến Nghé, Quận 1, TP.HCM",
    description:
      "Công trình kiến trúc thuộc địa Pháp tiêu biểu, được hoàn thành năm 1891 bởi kiến trúc sư Alfred Foulhoux, nổi bật với mái vòm cao, khung thép lớn và không gian sảnh trung tâm đặc trưng.",
    category: "Kiến trúc",
    relatedTopics: ["Sài Gòn 100 năm kiến trúc", "Hành trình 30/4"],
    videoLabel: "Video giới thiệu · 00:58",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    xp: "90 XP",
    status: "Chờ duyệt",
    statusStyle: "bg-amber-500/95 text-slate-900",
    badge: "Chờ duyệt",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/1200x/79/b4/a5/79b4a581d8f37e56d3a5c152a1e9a4c0.jpg",
    tags: ["#kientruc", "#disan"],
  },
  {
    slug: "bao-tang-chung-tich-chien-tranh",
    title: "Bảo tàng Chứng tích Chiến tranh",
    subtitle: "Bảo tàng · Quận 3",
    author: "Thu Hà",
    date: "21/5/2025",
    address: "28 Võ Văn Tần, Phường Võ Thị Sáu, Quận 3, TP.HCM",
    description:
      "Bảo tàng chuyên đề chiến tranh với hệ thống tư liệu, ảnh và hiện vật giúp người xem tiếp cận lịch sử chiến tranh Việt Nam qua nhiều lớp câu chuyện và góc nhìn khác nhau.",
    category: "Bảo tàng",
    relatedTopics: ["Hành trình 30/4", "Củ Chi - Lòng đất bất khuất"],
    xp: "150 XP",
    status: "Chờ duyệt",
    statusStyle: "bg-amber-500/95 text-slate-900",
    badge: "Chờ duyệt",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/736x/aa/5c/eb/aa5cebb1ed4837b3bb3c8d8044889f0c.jpg",
    tags: ["#chientranh", "#lichsu"],
  },
  {
    slug: "cho-ben-thanh",
    title: "Chợ Bến Thành",
    subtitle: "Di sản văn hóa · Quận 1",
    author: "Hữu Phước",
    date: "22/5/2025",
    address: "Lê Lợi, Bến Thành, Quận 1, TP.HCM",
    description:
      "Biểu tượng thương mại lâu đời của trung tâm Sài Gòn, nơi giao thoa giữa kiến trúc chợ truyền thống, nhịp sống đô thị và trải nghiệm văn hóa ẩm thực đặc trưng của thành phố.",
    category: "Văn hoá",
    relatedTopics: ["Sài Gòn 100 năm kiến trúc"],
    xp: "80 XP",
    status: "Bản nháp",
    statusStyle: "bg-slate-500/95 text-white",
    badge: "Bản nháp",
    gps: "GPS sai",
    image:
      "https://i.pinimg.com/736x/e2/a1/8d/e2a18d5e2cdf73778c0e34299ab42a0a.jpg",
    tags: ["#vanhoa", "#disan"],
  },
  {
    slug: "dia-dao-cu-chi",
    title: "Địa đạo Củ Chi",
    subtitle: "Di tích lịch sử · Huyện Củ Chi",
    author: "Thu Hà",
    date: "12/5/2025",
    address: "TL15, Phú Hiệp, Củ Chi, TP.HCM",
    description:
      "Quần thể địa đạo dài hàng trăm cây số từng đóng vai trò chiến lược trong kháng chiến, hiện là điểm đến lịch sử kết hợp trải nghiệm không gian sinh tồn dưới lòng đất.",
    category: "Lịch sử",
    relatedTopics: ["Củ Chi - Lòng đất bất khuất", "Hành trình 30/4"],
    videoLabel: "Video giới thiệu · 02:06",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    xp: "200 XP",
    status: "Đã xuất bản",
    statusStyle: "bg-emerald-500/10 text-emerald-700",
    badge: "Đã xuất bản",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/736x/f9/c9/d5/f9c9d53ab1360359d2742937442387a1.jpg",
    tags: ["#chientranh", "#lichsu"],
  },
  {
    slug: "chua-vinh-nghiem",
    title: "Chùa Vĩnh Nghiêm",
    subtitle: "Kiến trúc tôn giáo · Quận 3",
    author: "Minh Quân",
    date: "18/5/2025",
    address: "339 Nam Kỳ Khởi Nghĩa, Phường 7, Quận 3, TP.HCM",
    description:
      "Ngôi chùa nổi bật với kiến trúc Phật giáo Bắc tông quy mô lớn, tháp đá bảy tầng và không gian sinh hoạt tôn giáo quen thuộc của cư dân nội đô Sài Gòn.",
    category: "Văn hoá",
    relatedTopics: ["Sài Gòn 100 năm kiến trúc"],
    videoLabel: "Video giới thiệu · 01:05",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    xp: "90 XP",
    status: "Bị từ chối",
    statusStyle: "bg-red-600/95 text-white",
    badge: "Bị từ chối",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/1200x/6a/a0/64/6aa0646cf8b48aeca2f96c25168efaee.jpg",
    tags: ["#vanhoa", "#kientruc"],
  },
  {
    slug: "pho-di-bo-nguyen-hue",
    title: "Phố đi bộ Nguyễn Huệ",
    subtitle: "Không gian công cộng · Quận 1",
    author: "Hữu Phước",
    date: "30/4/2025",
    address: "Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM",
    description:
      "Trục không gian công cộng trung tâm nối từ trụ sở UBND Thành phố đến bến Bạch Đằng, là nơi diễn ra nhiều hoạt động văn hóa, lễ hội và trải nghiệm phố đi bộ về đêm.",
    category: "Văn hoá",
    relatedTopics: ["Hành trình 30/4"],
    xp: "60 XP",
    status: "Đã lưu trữ",
    statusStyle: "bg-slate-500/95 text-white",
    badge: "Đã lưu trữ",
    gps: "GPS OK",
    image:
      "https://i.pinimg.com/1200x/ac/38/46/ac3846610b7bd4f3bb2d2873fac300d6.jpg",
    tags: ["#vanhoa"],
  },
];

const hotspotProfiles: Record<string, HotspotProfile> = {
  "dinh-doc-lap": {
    coordinates: "10.7771, 106.6953",
    district: "Quận 1, TP.HCM",
    estimatedVisit: "60 - 90 phút",
    bestTime: "08:30 - 10:30",
    accessibility: "Phù hợp tour lịch sử, nhóm học sinh và khách gia đình.",
    lastUpdated: "25/5/2025",
    factSheet: [
      "Mặt đứng và trục sảnh chính là góc ảnh nhận diện mạnh nhất của hotspot.",
      "Nội dung nên nhấn vào mốc 30/4 và hệ thống không gian hầm chỉ huy.",
      "Có thể ghép thành điểm mở đầu cho tuyến kể chuyện lịch sử trung tâm.",
    ],
    editorialNote:
      "Bộ nội dung hiện đã cân bằng giữa giá trị lịch sử và trải nghiệm tham quan, phù hợp để làm hotspot đầu tuyến.",
    preservationNote:
      "Ưu tiên ảnh chụp rõ mặt đứng, chú thích đúng tên phòng và tránh mô tả trùng lặp với phần giới thiệu tuyến.",
    stats: {
      checkIns: "1.240",
      saves: "382",
      routes: "2 tuyến",
    },
  },
  "nha-tho-duc-ba-sai-gon": {
    coordinates: "10.7798, 106.6990",
    district: "Quận 1, TP.HCM",
    estimatedVisit: "30 - 45 phút",
    bestTime: "07:00 - 09:00",
    accessibility: "Phù hợp khách đi bộ nội đô, tuyến kiến trúc và nhóm nhỏ.",
    lastUpdated: "24/5/2025",
    factSheet: [
      "Hotspot mạnh về nhận diện thị giác nhờ gạch đỏ và cặp tháp chuông đôi.",
      "Nên dẫn dắt nội dung theo trục Nhà thờ - Bưu điện - Công xã Paris.",
      "Tập trung mô tả ngắn, dễ đọc vì đây thường là điểm dừng nhanh.",
    ],
    editorialNote:
      "Nội dung phù hợp với nhịp đọc nhanh tại điểm, nên ưu tiên câu ngắn và thông tin gợi mở về kiến trúc.",
    preservationNote:
      "Cần kiểm tra mô tả theo tiến độ trùng tu thực tế để tránh dùng thông tin lỗi thời trong phần giới thiệu.",
    stats: {
      checkIns: "1.010",
      saves: "295",
      routes: "1 tuyến",
    },
  },
  "buu-dien-trung-tam": {
    coordinates: "10.7797, 106.6992",
    district: "Quận 1, TP.HCM",
    estimatedVisit: "25 - 40 phút",
    bestTime: "09:00 - 11:00",
    accessibility: "Phù hợp khách đi bộ nội đô và tuyến kiến trúc trung tâm.",
    lastUpdated: "23/5/2025",
    factSheet: [
      "Không gian sảnh trung tâm là phần kể chuyện nên ưu tiên nhất trong bộ ảnh.",
      "Có thể dùng như điểm nối giữa kiến trúc thuộc địa và lịch sử đô thị Sài Gòn.",
      "Video ngắn dưới 1 phút phù hợp vì hành vi dừng tại điểm thường không dài.",
    ],
    editorialNote:
      "Hotspot có đủ cấu phần hình ảnh, video và định vị, chỉ cần tinh gọn tiêu đề phụ trước khi duyệt.",
    preservationNote:
      "Nên bổ sung thêm một ảnh cận chi tiết mái vòm hoặc quầy giao dịch cổ để tăng chiều sâu nội dung.",
    stats: {
      checkIns: "864",
      saves: "240",
      routes: "2 tuyến",
    },
  },
  "bao-tang-chung-tich-chien-tranh": {
    coordinates: "10.7795, 106.6920",
    district: "Quận 3, TP.HCM",
    estimatedVisit: "75 - 120 phút",
    bestTime: "09:00 - 11:30",
    accessibility: "Phù hợp tuyến học thuật, khách quốc tế và nhóm học sinh lớn.",
    lastUpdated: "24/5/2025",
    factSheet: [
      "Nội dung nên có cảnh báo cảm xúc vì đây là điểm chạm mạnh về chủ đề chiến tranh.",
      "Có thể chia câu chuyện theo tư liệu ảnh, hiện vật và trải nghiệm tham quan.",
      "Phù hợp làm điểm sâu trong tuyến lịch sử thay vì điểm khởi đầu.",
    ],
    editorialNote:
      "Cấu trúc mô tả hiện tốt nhưng nên bổ sung thêm định hướng trải nghiệm để người dùng hiểu cách tiếp cận nội dung tại điểm.",
    preservationNote:
      "Cần soát lại caption ảnh để đảm bảo ngữ cảnh lịch sử chính xác và phù hợp đối tượng người xem đa dạng.",
    stats: {
      checkIns: "1.460",
      saves: "418",
      routes: "2 tuyến",
    },
  },
  "cho-ben-thanh": {
    coordinates: "10.7725, 106.6980",
    district: "Quận 1, TP.HCM",
    estimatedVisit: "30 - 50 phút",
    bestTime: "16:00 - 18:30",
    accessibility: "Phù hợp tuyến văn hoá đô thị và khách tự khám phá.",
    lastUpdated: "22/5/2025",
    factSheet: [
      "Hotspot mạnh ở nhịp sống đô thị và yếu tố ẩm thực - mua sắm đi kèm.",
      "Nội dung nên tránh sa vào liệt kê sạp hàng, ưu tiên tinh thần biểu tượng.",
      "Định vị hiện cần kiểm tra lại trước khi đủ điều kiện xuất bản.",
    ],
    editorialNote:
      "Nên hoàn thiện lại GPS và bổ sung một điểm nhấn về lịch sử hình thành để thoát khỏi cảm giác mô tả chung chung.",
    preservationNote:
      "Cần xác minh lại ảnh bìa và vị trí check-in mặc định để tránh sai lệch khi người dùng đến thực địa.",
    stats: {
      checkIns: "730",
      saves: "268",
      routes: "1 tuyến",
    },
  },
  "dia-dao-cu-chi": {
    coordinates: "11.1421, 106.4620",
    district: "Huyện Củ Chi, TP.HCM",
    estimatedVisit: "120 - 180 phút",
    bestTime: "08:00 - 10:00",
    accessibility: "Phù hợp tour nửa ngày, nhóm học sinh và khách tìm hiểu lịch sử.",
    lastUpdated: "20/5/2025",
    factSheet: [
      "Nội dung cần nhấn vào trải nghiệm không gian hẹp và mạng lưới địa đạo đa tầng.",
      "Hotspot có thể đứng độc lập hoặc làm điểm cao trào cho tuyến Củ Chi.",
      "Video hiện tại đủ mạnh để đóng vai trò media chính trong trang chi tiết.",
    ],
    editorialNote:
      "Đây là hotspot có chiều sâu trải nghiệm tốt, nên giữ nhịp kể chắc và tránh trùng ý giữa mô tả với caption media.",
    preservationNote:
      "Cần thống nhất cách gọi các khu vực trải nghiệm để người dùng không nhầm giữa địa đạo gốc và khu tái hiện.",
    stats: {
      checkIns: "1.820",
      saves: "512",
      routes: "2 tuyến",
    },
  },
  "chua-vinh-nghiem": {
    coordinates: "10.7871, 106.6881",
    district: "Quận 3, TP.HCM",
    estimatedVisit: "30 - 45 phút",
    bestTime: "06:30 - 08:00",
    accessibility: "Phù hợp tuyến văn hoá - tôn giáo và người dùng đi bộ ngắn.",
    lastUpdated: "21/5/2025",
    factSheet: [
      "Điểm mạnh là tháp đá và quy mô tổng thể của ngôi chùa trong bối cảnh nội đô.",
      "Nội dung nên chú ý giọng điệu trung tính, tôn trọng không gian tín ngưỡng.",
      "Hotspot đang bị từ chối nên cần rà lại cách đặt tiêu đề và độ chính xác của mô tả.",
    ],
    editorialNote:
      "Nội dung hiện có tiềm năng nhưng cần chỉnh lại giọng mô tả để bớt quảng bá và tăng tính thông tin.",
    preservationNote:
      "Nên bổ sung nguồn kiểm chứng cho chi tiết kiến trúc và rà lại phần mô tả hoạt động tôn giáo thường nhật.",
    stats: {
      checkIns: "540",
      saves: "186",
      routes: "1 tuyến",
    },
  },
  "pho-di-bo-nguyen-hue": {
    coordinates: "10.7734, 106.7030",
    district: "Quận 1, TP.HCM",
    estimatedVisit: "20 - 40 phút",
    bestTime: "18:00 - 21:00",
    accessibility: "Phù hợp tuyến tự do buổi tối, nhóm bạn và khách gia đình.",
    lastUpdated: "18/5/2025",
    factSheet: [
      "Đây là hotspot giàu hoạt động, cần kể bằng nhịp nhanh và nhiều cảnh sinh hoạt.",
      "Nội dung phù hợp để nối sang bến Bạch Đằng hoặc trụ sở UBND Thành phố.",
      "Trạng thái lưu trữ cho thấy hotspot cần quyết định lại vai trò trong bộ sưu tập hiện tại.",
    ],
    editorialNote:
      "Nếu kích hoạt lại, nên viết theo hướng trải nghiệm công cộng và mốc sự kiện thay vì mô tả không gian đơn thuần.",
    preservationNote:
      "Cần đánh giá lại ảnh đại diện theo bối cảnh ban đêm để phản ánh đúng trải nghiệm thực tế nổi bật nhất.",
    stats: {
      checkIns: "688",
      saves: "214",
      routes: "1 tuyến",
    },
  },
};

export function getHotspotBySlug(slug: string) {
  return hotspotItems.find((item) => item.slug === slug) ?? null;
}

export function getHotspotProfile(slug: string) {
  return hotspotProfiles[slug] ?? null;
}

export function buildMapEmbedUrl(address: string) {
  const normalizedAddress = address.trim();

  return normalizedAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(normalizedAddress)}&z=16&output=embed`
    : "";
}

export function buildGoogleMapsUrl(address: string) {
  const normalizedAddress = address.trim();

  return normalizedAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedAddress)}`
    : "";
}
