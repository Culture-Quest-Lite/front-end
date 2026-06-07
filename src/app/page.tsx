"use client";

import Image from "next/image";
import { useState, type FormEvent, type ReactNode } from "react";

type TravelCardDefinition = {
  id: number;
  alt: string;
  className: string;
  imageUrl: string;
};
const travelCards: TravelCardDefinition[] = [
  {
    id: 1,
    alt: "Colorful city postcard",
    className:
      "left-[5%] top-[14%] z-10 h-[172px] w-[126px] -rotate-[18deg] sm:h-[194px] sm:w-[142px]",
    imageUrl:
      "https://i.pinimg.com/1200x/af/ff/64/afff6485499955156f0814628ca1e95f.jpg",
  },
  {
    id: 2,
    alt: "Tropical coast postcard",
    className:
      "left-[34%] top-[3%] z-20 h-[158px] w-[116px] -rotate-[4deg] sm:h-[176px] sm:w-[128px]",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    alt: "Harbor postcard",
    className:
      "right-[5%] top-[7%] z-10 h-[178px] w-[128px] rotate-[16deg] sm:h-[198px] sm:w-[144px]",
    imageUrl:
      "https://i.pinimg.com/1200x/b0/c9/c4/b0c9c47d3e06e8b7200a98d886dcec8b.jpg",
  },
  {
    id: 4,
    alt: "Market street postcard",
    className:
      "right-[6%] top-[38%] z-10 h-[168px] w-[122px] rotate-[18deg] sm:h-[188px] sm:w-[136px]",
    imageUrl:
      "https://i.pinimg.com/736x/ef/57/1c/ef571cd6d3825c4429ab2c581c6265c5.jpg",
  },
  {
    id: 5,
    alt: "Sunny landmark postcard",
    className:
      "left-[10%] bottom-[9%] z-10 h-[172px] w-[126px] -rotate-[28deg] sm:h-[192px] sm:w-[142px]",
    imageUrl:
      "https://i.pinimg.com/736x/32/ad/da/32adda3ebf4016820e5ab3c1bf6866cf.jpg",
  },
  {
    id: 6,
    alt: "Old town postcard",
    className:
      "left-[43%] bottom-[4%] z-0 h-[164px] w-[118px] -rotate-[8deg] sm:h-[182px] sm:w-[132px]",
    imageUrl:
      "https://i.pinimg.com/1200x/5f/83/c6/5f83c650f0c2f6c3c8d34e014d65d019.jpg",
  },
];

const featuredCard = {
  alt: "Beach and palm trees postcard",
  className:
    "left-[30%] top-[19%] z-30 h-[218px] w-[160px] rotate-[6deg] sm:h-[244px] sm:w-[178px]",
  imageUrl:
    "https://i.pinimg.com/1200x/65/58/cb/6558cbb31d2a7120730b678f406fdb9a.jpg",
};

export default function TravelLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="h-dvh overflow-hidden bg-[linear-gradient(180deg,_#fbfbfc_0%,_#f6f8fb_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <section className="relative mx-auto flex h-[calc(100dvh-2rem)] max-w-[1320px] items-center justify-center overflow-hidden rounded-[34px] bg-[#fcfcfd] shadow-[0_30px_80px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
        <DecorativePaths />

        <div className="relative z-10 grid w-full items-center gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(400px,0.96fr)_minmax(400px,1fr)] lg:px-12 lg:py-8">
          <div className="mx-auto w-full max-w-[400px] lg:mx-0 lg:max-w-[440px] lg:pr-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo2.png"
                alt="Culture Quest Lite"
                width={46}
                height={46}
                priority
                className="h-15 w-15 object-contain"
              />
              <span className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-900">
                Culture Quest Lite
              </span>
            </div>

            <h1 className="mt-9 max-w-[390px]  text-[1.95rem] font-bold leading-[1.03] tracking-[-0.06em] text-slate-950 sm:text-[2.2rem] lg:text-[2.45rem]">
              Chào mừng bạn trở lại !
            </h1>

            <div className="text-center">
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Đăng nhập để tiếp tục vào khu vực quản trị và biên tập nội dung.
              </p>
            </div>

            <form className="mt-7 space-y-3.5" onSubmit={handleSubmit}>
              <div>
                <label className="sr-only" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="h-[3rem] w-full rounded-full bg-[#f1f6fb] px-5 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,103,154,0.08)]"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Hãy nhập email hoặc số điện thoại"
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div>
                <label className="sr-only" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="h-[3rem] w-full rounded-full bg-[#f1f6fb] px-5 text-[11px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,103,154,0.08)]"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  required
                  type="password"
                  value={password}
                />
              </div>

              <div className="pr-2 text-right">
                <button
                  className="text-[10px] font-medium text-slate-400 transition hover:text-[#dd4a8d]"
                  type="button"
                >
                  Bạn quên mật khẩu?
                </button>
              </div>

              <button
                className="h-[3rem] w-full rounded-full bg-[linear-gradient(90deg,_#eb489b_0%,_#f58752_58%,_#ffc93c_100%)] text-[13px] font-semibold text-white shadow-[0_16px_28px_rgba(235,72,155,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(235,72,155,0.28)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(255,103,154,0.12)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
                type="submit"
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div className="mt-5">
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>Hhoặc tiếp tục với</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="mt-3.5 flex justify-center gap-3">
                <SocialButton label="Google">
                  <GoogleIcon />
                </SocialButton>

                <SocialButton label="Facebook">
                  <FacebookIcon />
                </SocialButton>
              </div>
            </div>

            <p className="mt-5 text-center text-[10px] text-slate-500">
              Chưa có tài khoản?{" "}
              <button
                className="font-semibold text-[#eb489b] transition hover:text-[#f08d43]"
                type="button"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>

          <div className="relative flex min-h-[360px] items-center justify-center lg:min-h-[520px] lg:justify-end">
            <div className="relative h-[350px] w-full max-w-[540px] sm:h-[410px] lg:h-[490px]">
              {travelCards.map((card) => (
                <Postcard
                  key={card.id}
                  alt={card.alt}
                  className={card.className}
                  imageUrl={card.imageUrl}
                />
              ))}

              <Postcard
                alt={featuredCard.alt}
                className={featuredCard.className}
                featured
                imageUrl={featuredCard.imageUrl}
              />

              <div className="pointer-events-none absolute inset-x-[20%] bottom-3 h-12 rounded-full bg-white/70 blur-2xl" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DecorativePaths() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      fill="none"
      viewBox="0 0 1440 920"
    >
      <path
        d="M856 8c-28 62 10 99-14 141-28 47-84 9-110 56-30 54 33 84 2 131"
        stroke="#67c9ff"
        strokeDasharray="10 15"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M1150 30c48 16 97 52 82 96-18 52-76 18-117 70-39 50 58 72 24 122"
        stroke="#cad86b"
        strokeDasharray="10 15"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M1318 222c-32 33-53 92-11 132 46 44 104-3 132 45 26 45-37 95-22 148"
        stroke="#ef93b4"
        strokeDasharray="10 15"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M760 254c-30 28-60 76-41 116 22 43 78 31 97 74 17 41-24 85-2 129"
        stroke="#d6b7ff"
        strokeDasharray="10 15"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M963 195c-46 23-92 72-84 122 8 50 74 52 81 104 7 51-49 85-42 132"
        stroke="#8fe6c7"
        strokeDasharray="10 15"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M690 562c-54 10-111 48-117 99-7 55 62 81 53 137"
        stroke="#f3c75d"
        strokeDasharray="10 15"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M1012 728c40-32 91-64 129-34 44 33-4 96 44 124 44 26 90-24 132-13"
        stroke="#71e2d6"
        strokeDasharray="10 15"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M860 706c-34 22-68 61-58 101 11 45 62 59 67 104"
        stroke="#f5aa86"
        strokeDasharray="10 15"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M1232 585c-29 30-46 77-19 113 30 39 82 26 109 61 23 31 17 70 33 102"
        stroke="#9ad8ff"
        strokeDasharray="10 15"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function SocialButton({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 transition hover:-translate-y-0.5 hover:border-[#ffcfdf] hover:text-[#de4b8e]"
      type="button"
    >
      {children}
    </button>
  );
}

function Postcard({
  alt,
  className,
  featured = false,
  imageUrl,
}: {
  alt: string;
  className: string;
  featured?: boolean;
  imageUrl: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <div
        className={`relative h-full w-full bg-white ring-1 ring-black/5 ${
          featured
            ? "rounded-[28px] p-3 shadow-[0_28px_52px_rgba(15,23,42,0.18)]"
            : "rounded-[24px] p-2.5 shadow-[0_18px_34px_rgba(15,23,42,0.14)]"
        }`}
      >
        {featured ? (
          <div className="absolute left-1/2 top-2.5 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_2px_rgba(243,198,219,0.85)]">
            <div className="h-3 w-3 rounded-full bg-[#ed539f]" />
          </div>
        ) : null}

        <div
          aria-label={alt}
          className={`relative h-full w-full overflow-hidden bg-slate-100 bg-cover bg-center ${
            featured ? "rounded-[21px]" : "rounded-[18px]"
          }`}
          role="img"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(15,23,42,0.03)_0%,_rgba(15,23,42,0.1)_100%)]" />
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M21.8 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.49a4.7 4.7 0 0 1-2.04 3.08v2.55h3.3c1.93-1.78 3.05-4.4 3.05-7.62Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.08-.92 6.78-2.48l-3.3-2.55c-.92.62-2.09 1-3.48 1-2.67 0-4.94-1.8-5.75-4.22H2.85v2.63A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.25 13.75A5.99 5.99 0 0 1 5.93 12c0-.61.11-1.2.32-1.75V7.62H2.85A9.97 9.97 0 0 0 2 12c0 1.61.38 3.13 1.05 4.38l3.2-2.63Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.03c1.5 0 2.84.52 3.9 1.54l2.93-2.93C17.07 2.98 14.75 2 12 2a10 10 0 0 0-9.15 5.62l3.4 2.63C7.06 7.83 9.33 6.03 12 6.03Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M13.5 21v-7.05h2.37l.35-2.75H13.5V9.44c0-.8.22-1.34 1.37-1.34h1.46V5.64c-.25-.04-1.13-.11-2.15-.11-2.13 0-3.58 1.3-3.58 3.68v2.01H8.2v2.75h2.4V21h2.9Z" />
    </svg>
  );
}
