"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Smartphone,
} from "lucide-react";

import { PageLoading } from "@/components/app/page-loading";
import { authApi } from "@/services/api";

/** Khớp `@Size(min = 6)` ở `ResetPasswordRequest.java` bên backend. */
const minPasswordLength = 6;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

type ResetFieldErrors = {
  newPassword?: string;
  confirmPassword?: string;
};

function validateResetForm(
  newPassword: string,
  confirmPassword: string,
): ResetFieldErrors {
  const errors: ResetFieldErrors = {};

  if (!newPassword) {
    errors.newPassword = "Vui lòng nhập mật khẩu mới.";
  } else if (newPassword.length < minPasswordLength) {
    errors.newPassword = `Mật khẩu mới tối thiểu ${minPasswordLength} ký tự.`;
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Vui lòng nhập lại mật khẩu mới.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Mật khẩu nhập lại không khớp.";
  }

  return errors;
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return email;
  }

  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(name.length - visible.length, 1))}@${domain}`;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

/**
 * Trang này có hai chế độ:
 *
 * - Có `?token=` (người dùng bấm link trong email) → form đặt mật khẩu mới.
 * - Không có token (bấm "Bạn quên mật khẩu?" ở trang đăng nhập) → form nhập
 *   email để backend gửi link.
 *
 * Gộp vào một route để link dự phòng trong email của app mobile và lối vào từ
 * web dùng chung một địa chỉ.
 */
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  return (
    <AuthShell>
      {token ? <ResetPasswordForm token={token} /> : <RequestResetLinkForm />}
    </AuthShell>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const nextFieldErrors = validateResetForm(password, confirmPassword);
    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.newPassword || nextFieldErrors.confirmPassword) {
      setError("");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authApi.resetPassword({
        token,
        newPassword: password,
        confirmPassword,
      });

      setIsDone(true);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Đặt lại mật khẩu thất bại. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (isDone) {
    return (
      <PanelShell>
        <SuccessBadge />

        <h1 className="mt-6 text-[1.75rem] font-bold leading-[1.08] tracking-[-0.05em] text-slate-950 sm:text-[2.1rem]">
          Đổi mật khẩu thành công
        </h1>

        <p className="mt-3 text-[13px] leading-6 text-slate-500 sm:text-[12px] sm:leading-5">
          Bạn có thể đăng nhập lại bằng mật khẩu mới ngay bây giờ.
        </p>

        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f1f6fb] px-4 py-3.5">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#dd4a8d]" />
          <p className="text-[12px] leading-5 text-slate-500">
            Đang dùng điện thoại? Hãy mở lại ứng dụng Culture Quest Lite và đăng
            nhập bằng mật khẩu vừa đặt.
          </p>
        </div>

        <button
          className="mt-6 h-12 w-full rounded-full bg-[linear-gradient(90deg,_#eb489b_0%,_#f58752_58%,_#ffc93c_100%)] text-[14px] font-semibold text-white shadow-[0_16px_28px_rgba(235,72,155,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(235,72,155,0.28)] focus:shadow-[0_0_0_4px_rgba(255,103,154,0.12)] focus:outline-none sm:h-[3.15rem] sm:text-[13px]"
          onClick={() => router.push("/")}
          type="button"
        >
          Về trang đăng nhập
        </button>
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <BackToLoginButton />
      <BrandHeader />

      <h1 className="mt-6 text-[1.75rem] font-bold leading-[1.08] tracking-[-0.05em] text-slate-950 sm:mt-7 sm:text-[2.1rem] lg:text-[2.35rem]">
        Đặt lại mật khẩu
      </h1>

      <p className="mt-3 text-[13px] leading-6 text-slate-500 sm:text-[12px] sm:leading-5">
        Nhập mật khẩu mới và xác nhận mật khẩu mới để hoàn tất quá trình đặt lại
        mật khẩu.
      </p>

      <form className="mt-6 space-y-3.5 sm:mt-7" noValidate onSubmit={handleResetPassword}>
        {error ? (
          <div className="rounded-2xl bg-red-50 p-3.5 text-center">
            <p className="text-[12px] font-medium leading-5 text-red-800">
              {error}
            </p>
          </div>
        ) : null}

        <PasswordField
          id="new-password"
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          value={password}
          visible={isPasswordVisible}
          errorMessage={fieldErrors.newPassword}
          onChange={(value) => {
            setPassword(value);
            setError("");
          }}
          onToggleVisible={() => setIsPasswordVisible((visible) => !visible)}
        />

        <PasswordField
          id="confirm-password"
          label="Xác nhận mật khẩu mới"
          placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword}
          visible={isConfirmPasswordVisible}
          errorMessage={fieldErrors.confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            setError("");
          }}
          onToggleVisible={() =>
            setIsConfirmPasswordVisible((visible) => !visible)
          }
        />

        <button
          className="h-12 w-full rounded-full bg-[linear-gradient(90deg,_#eb489b_0%,_#f58752_58%,_#ffc93c_100%)] text-[14px] font-semibold text-white shadow-[0_16px_28px_rgba(235,72,155,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(235,72,155,0.28)] focus:shadow-[0_0_0_4px_rgba(255,103,154,0.12)] focus:outline-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 sm:h-[3.15rem] sm:text-[13px]"
          disabled={loading}
          type="submit"
        >
          {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
        </button>
      </form>

      <p className="mt-5 text-center text-[12px] leading-5 text-slate-400 sm:text-[11px]">
        Liên kết đã hết hạn?{" "}
        <button
          className="font-semibold text-[#dd4a8d] transition hover:underline"
          onClick={() => router.replace("/reset-password")}
          type="button"
        >
          Gửi lại liên kết mới
        </button>
      </p>
    </PanelShell>
  );
}

function RequestResetLinkForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const submitRequest = async (targetEmail: string) => {
    setError("");
    setLoading(true);

    try {
      // Không gửi `platform` nên backend trả link web — đúng cho luồng trình duyệt.
      await authApi.forgotPassword({ email: targetEmail });
      setSentTo(targetEmail);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Không gửi được email khôi phục. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setFieldError("Vui lòng nhập email.");
      setError("");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setFieldError("Định dạng email không hợp lệ.");
      setError("");
      return;
    }

    setFieldError("");
    setEmail(normalizedEmail);
    await submitRequest(normalizedEmail);
  };

  if (sentTo) {
    return (
      <PanelShell>
        <SuccessBadge />

        <h1 className="mt-6 text-[1.75rem] font-bold leading-[1.08] tracking-[-0.05em] text-slate-950 sm:text-[2.1rem]">
          Đã gửi email khôi phục
        </h1>

        <p className="mt-3 text-[13px] leading-6 text-slate-500 sm:text-[12px] sm:leading-5">
          Chúng tôi đã gửi liên kết đặt lại mật khẩu tới{" "}
          <span className="font-semibold text-slate-800">
            {maskEmail(sentTo)}
          </span>
          . Liên kết có hiệu lực trong 15 phút và chỉ dùng được một lần.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl bg-red-50 p-3.5 text-center">
            <p className="text-[12px] font-medium leading-5 text-red-800">
              {error}
            </p>
          </div>
        ) : null}

        <button
          className="mt-6 h-12 w-full rounded-full border border-slate-200 bg-white text-[14px] font-semibold text-slate-600 transition hover:border-[#dd4a8d] hover:text-[#dd4a8d] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[3.15rem] sm:text-[13px]"
          disabled={loading}
          onClick={() => void submitRequest(sentTo)}
          type="button"
        >
          {loading ? "Đang gửi lại..." : "Gửi lại email"}
        </button>

        <p className="mt-5 text-center text-[12px] leading-5 text-slate-400 sm:text-[11px]">
          Không thấy email? Kiểm tra thêm mục Spam hoặc Quảng cáo.
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <BackToLoginButton />
      <BrandHeader />

      <h1 className="mt-6 text-[1.75rem] font-bold leading-[1.08] tracking-[-0.05em] text-slate-950 sm:mt-7 sm:text-[2.1rem] lg:text-[2.35rem]">
        Quên mật khẩu?
      </h1>

      <p className="mt-3 text-[13px] leading-6 text-slate-500 sm:text-[12px] sm:leading-5">
        Nhập email của tài khoản, chúng tôi sẽ gửi cho bạn liên kết để đặt lại
        mật khẩu.
      </p>

      <form className="mt-6 space-y-3.5 sm:mt-7" noValidate onSubmit={handleRequestLink}>
        {error ? (
          <div className="rounded-2xl bg-red-50 p-3.5 text-center">
            <p className="text-[12px] font-medium leading-5 text-red-800">
              {error}
            </p>
          </div>
        ) : null}

        <div>
          <label className="sr-only" htmlFor="reset-email">
            Email
          </label>

          <div className="relative">
            <Mail className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              aria-describedby={fieldError ? "reset-email-error" : undefined}
              aria-invalid={fieldError ? "true" : "false"}
              autoComplete="email"
              className="h-12 w-full rounded-full bg-[#f1f6fb] px-12 text-[16px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,103,154,0.08)] sm:h-[3.15rem] sm:text-[12px]"
              id="reset-email"
              inputMode="email"
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldError("");
                setError("");
              }}
              placeholder="Nhập email của bạn"
              type="email"
              value={email}
            />
          </div>

          {fieldError ? (
            <p
              className="mt-2 pl-5 text-[12px] font-medium text-red-600 sm:text-[11px]"
              id="reset-email-error"
            >
              {fieldError}
            </p>
          ) : null}
        </div>

        <button
          className="h-12 w-full rounded-full bg-[linear-gradient(90deg,_#eb489b_0%,_#f58752_58%,_#ffc93c_100%)] text-[14px] font-semibold text-white shadow-[0_16px_28px_rgba(235,72,155,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(235,72,155,0.28)] focus:shadow-[0_0_0_4px_rgba(255,103,154,0.12)] focus:outline-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 sm:h-[3.15rem] sm:text-[13px]"
          disabled={loading}
          type="submit"
        >
          {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
        </button>
      </form>
    </PanelShell>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  visible,
  errorMessage,
  onChange,
  onToggleVisible,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  errorMessage?: string;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
}) {
  return (
    <div>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>

      <div className="relative">
        <LockKeyhole className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          aria-describedby={errorMessage ? `${id}-error` : undefined}
          aria-invalid={errorMessage ? "true" : "false"}
          autoComplete="new-password"
          className="h-12 w-full rounded-full bg-[#f1f6fb] px-12 text-[16px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,103,154,0.08)] sm:h-[3.15rem] sm:text-[12px]"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          value={value}
        />

        <button
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-4 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-[#dd4a8d]"
          onClick={onToggleVisible}
          type="button"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {errorMessage ? (
        <p
          className="mt-2 pl-5 text-[12px] font-medium text-red-600 sm:text-[11px]"
          id={`${id}-error`}
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function SuccessBadge() {
  return (
    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#eafaf1]">
      <CheckCircle2 className="h-7 w-7 text-[#2fa36b]" />
    </div>
  );
}

function BackToLoginButton() {
  const router = useRouter();

  return (
    <button
      className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-500 transition hover:text-[#dd4a8d] sm:text-[11px]"
      onClick={() => router.push("/")}
      type="button"
    >
      <ArrowLeft className="h-4 w-4" />
      Quay lại đăng nhập
    </button>
  );
}

/** Cột nội dung: full width trên điện thoại, giới hạn bề ngang từ tablet trở lên. */
function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[430px] lg:mx-0">{children}</div>
  );
}

/**
 * Điện thoại: một cột tràn viền, không bo góc, chừa safe-area dưới.
 * Từ `sm` trở lên mới dựng lại khung thẻ bo tròn, và từ `lg` mới hiện postcard.
 */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,_#fbfbfc_0%,_#f6f8fb_100%)] sm:px-6 sm:py-4 lg:px-8">
      <section className="relative mx-auto grid min-h-dvh w-full max-w-[1320px] grid-cols-1 overflow-hidden bg-[#fcfcfd] sm:min-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:ring-1 sm:ring-black/5 lg:grid-cols-[minmax(380px,0.92fr)_minmax(420px,1fr)] lg:rounded-[34px]">
        <DecorativePaths />

        <div className="relative z-10 flex items-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 sm:px-10 sm:py-8 lg:px-12">
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
      className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-80 sm:block"
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
