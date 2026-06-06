export default function CuratorStoriesPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="cq-page-title">Câu chuyện</h1>
        <p className="cq-page-subtitle max-w-2xl">
          Quản lý các câu chuyện kể đi kèm hotspot và tuyến hành trình.
        </p>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="cq-section-title">Đang cập nhật</h2>
        <p className="cq-card-copy mt-3">
          Trang quản lý câu chuyện sẽ dùng cùng scale typography với các trang
          curator còn lại.
        </p>
      </section>
    </div>
  );
}
