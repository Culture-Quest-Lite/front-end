import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black font-sans">
      <main className="w-full max-w-3xl p-8 bg-white dark:bg-black rounded-lg shadow">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50">Trang chính</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Chọn một khu vực để truy cập:</p>
        </header>

        <nav className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/admin"
            className="flex h-12 items-center justify-center rounded-full bg-black text-white px-6"
          >
            Admin
          </Link>
          <Link
            href="/curator"
            className="flex h-12 items-center justify-center rounded-full border border-gray-200 px-6"
          >
            Curator
          </Link>
          <Link
            href="/curator/hotspot"
            className="flex h-12 items-center justify-center rounded-full border border-gray-200 px-6"
          >
            Hotspot
          </Link>
        </nav>

        <section className="mt-8">
          <Image src="/next.svg" alt="Next.js logo" width={100} height={20} className="dark:invert" />
        </section>
      </main>
    </div>
  );
}
