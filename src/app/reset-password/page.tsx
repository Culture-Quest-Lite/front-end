"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";

import { PageLoading } from "@/components/app/page-loading";

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
      "left-[4%] top-[18%] z-10 h-[130px] w-[96px] -rotate-[18deg] sm:h-[172px] sm:w-[126px] lg:h-[194px] lg:w-[142px]",
    imageUrl:
      "https://i.pinimg.com/1200x/af/ff/64/afff6485499955156f0814628ca1e95f.jpg",
  },
  {
    id: 2,
    alt: "Tropical coast postcard",
    className:
      "left-[35%] top-[4%] z-20 h-[124px] w-[92px] -rotate-[4deg] sm:h-[158px] sm:w-[116px] lg:h-[176px] lg:w-[128px]",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    alt: "Harbor postcard",
    className:
      "right-[4%] top-[12%] z-10 h-[132px] w-[98px] rotate-[16deg] sm:h-[178px] sm:w-[128px] lg:h-[198px] lg:w-[144px]",
    imageUrl:
      "https://i.pinimg.com/1200x/b0/c9/c4/b0c9c47d3e06e8b7200a98d886dcec8b.jpg",
  },
];

const featuredCard = {
  id: 4,
  alt: "Beach and palm trees postcard",
  className:
    "left-1/2 top-[24%] z-30 h-[170px] w-[126px] -translate-x-1/2 rotate-[6deg] sm:h-[218px] sm:w-[160px] lg:h-[244px] lg:w-[178px]",
  imageUrl:
    "https://i.pinimg.com/1200x/65/58/cb/6558cbb31d2a7120730b678f406fdb9a.jpg",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const handleResetPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log({
      password,
      confirmPassword,
    });

    // TODO: Call reset password API later
  };

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-[430px] lg:mx-0">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 transition hover:text-[#dd4a8d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </button>

        <BrandHeader />

        <h1 className="mt-7 text-[2rem] font-bold leading-[1.05] tracking-[-0.06em] text-slate-950 sm:text-[2.35rem]">
          Đặt lại mật khẩu
        </h1>

        <p className="mt-3 text-[12px] leading-5 text-slate-500">
          Nhập mật khẩu mới và xác nhận mật khẩu mới để hoàn tất quá trình đặt lại mật khẩu.
        </p>

        <form className="mt-7 space-y-3.5" onSubmit={handleResetPassword}>
          <PasswordField
            id="new-password"
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới"
            value={password}
            visible={isPasswordVisible}
            onChange={setPassword}
            onToggleVisible={() => setIsPasswordVisible((visible) => !visible)}
          />

          <PasswordField
            id="confirm-password"
            label="Xác nhận mật khẩu mới"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            visible={isConfirmPasswordVisible}
            onChange={setConfirmPassword}
            onToggleVisible={() =>
              setIsConfirmPasswordVisible((visible) => !visible)
            }
          />

          <button
            className="h-[3.15rem] w-full rounded-full bg-[linear-gradient(90deg,_#eb489b_0%,_#f58752_58%,_#ffc93c_100%)] text-[13px] font-semibold text-white shadow-[0_16px_28px_rgba(235,72,155,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(235,72,155,0.28)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(255,103,154,0.12)]"
            type="submit"
          >
            Đặt lại mật khẩu
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  visible,
  onChange,
  onToggleVisible,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
}) {
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>

      <LockKeyhole className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <input
        id={id}
        className="h-[3.15rem] w-full rounded-full bg-[#f1f6fb] px-12 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,103,154,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        type={visible ? "text" : "password"}
        value={value}
      />

      <button
        type="button"
        onClick={onToggleVisible}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-[#dd4a8d]"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,_#fbfbfc_0%,_#f6f8fb_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <section className="relative mx-auto grid min-h-[calc(100dvh-2rem)] max-w-[1320px] overflow-hidden rounded-[28px] bg-[#fcfcfd] shadow-[0_30px_80px_rgba(15,23,42,0.08)] ring-1 ring-black/5 lg:grid-cols-[minmax(380px,0.92fr)_minmax(420px,1fr)] lg:rounded-[34px]">
        <DecorativePaths />

        <div className="relative z-10 flex items-center px-6 py-8 sm:px-10 lg:px-12">
          {children}
        </div>

        <HeroPostcards />
      </section>
    </main>
  );
}

function BrandHeader() {
  return (
    <div className="mt-6 flex items-center gap-3">
      <Image
        src="/logo2.png"
        alt="Culture Quest Lite"
        width={52}
        height={52}
        priority
        className="h-13 w-13 object-contain"
      />

      <span className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-900">
        Culture Quest Lite
      </span>
    </div>
  );
}

function HeroPostcards() {
  return (
    <div className="relative z-10 hidden min-h-[430px] items-center justify-center lg:flex">
      <div className="relative h-[490px] w-full max-w-[540px]">
        {travelCards.map((card) => (
          <Postcard key={card.id} {...card} />
        ))}

        <Postcard {...featuredCard} featured />

        <div className="pointer-events-none absolute inset-x-[20%] bottom-3 h-12 rounded-full bg-white/70 blur-2xl" />
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return <PageLoading fullscreen />;
}

function DecorativePaths() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-80"
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
    </svg>
  );
}

type PostcardProps = TravelCardDefinition & {
  featured?: boolean;
};

function Postcard({
  alt,
  className,
  featured = false,
  imageUrl,
}: PostcardProps) {
  return (
    <div className={`absolute ${className}`}>
      <div
        className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-2 shadow-[0_24px_50px_rgba(15,23,42,0.16)] backdrop-blur ${
          featured ? "shadow-[0_28px_70px_rgba(235,72,155,0.22)]" : ""
        }`}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full rounded-[22px] object-cover"
        />
      </div>
    </div>
  );
}
