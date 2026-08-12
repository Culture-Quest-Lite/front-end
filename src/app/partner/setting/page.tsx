"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/ui-bits";
import {
  partnerApi,
  type CurrentUserProfileResponse,
} from "@/services/api/partner/partnerApi";
import {
  partnerSubscriptionApi,
  type PartnerSubscriptionResponse,
} from "@/services/api/partner/partnerSubscriptionApi";
import { authApi } from "@/services/api/authApi";
import { Eye, EyeOff, KeyRound, Loader2, Store, UserCog, X } from "lucide-react";

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Tạm ngưng",
  EXPIRED: "Hết hạn",
  DELETED: "Đã xoá",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatCurrency(value?: number | null) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function PartnerSettingPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUserProfileResponse | null>(null);
  const [subscriptions, setSubscriptions] = useState<PartnerSubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        setLoading(true);
        setLoadError(null);

        const [user, subscriptionResponse] = await Promise.all([
          partnerApi.getCurrentUser(),
          partnerSubscriptionApi.getMySubscriptions(),
        ]);

        if (cancelled) return;

        setCurrentUser(user);
        setSubscriptions(subscriptionResponse);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Không thể tải thông tin đối tác.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentSubscription = useMemo(() => {
    const active = subscriptions.find((item) => item.status === "ACTIVE");
    return active ?? subscriptions[0] ?? null;
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông tin đối tác"
        subtitle="Xem thông tin đối tác và gói subscription của bạn."
      />

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Hồ sơ đối tác</h2>
              <p className="mt-1 text-sm text-slate-500">
                Thông tin đăng nhập và liên hệ của đối tác.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <KeyRound className="h-4 w-4" />
              Đổi mật khẩu
            </button>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <InfoRow label="Tên đối tác" value={currentUser?.displayName || currentUser?.username || "—"} />
              <InfoRow label="Email" value={currentUser?.email || "—"} />
              <InfoRow label="Vai trò" value={currentUser?.role || "—"} />
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Subscription
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {currentSubscription?.subscriptionPlanName ?? "Chưa có gói"}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm">
              <Store className="h-5 w-5" />
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Đang tải gói subscription...</p>
          ) : currentSubscription ? (
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <InfoRow label="Trạng thái" value={statusLabels[currentSubscription.status ?? ""] ?? currentSubscription.status ?? "—"} />
              <InfoRow label="Chu kỳ" value={currentSubscription.billingCycle ?? "—"} />
              <InfoRow label="Ngày bắt đầu" value={formatDate(currentSubscription.startDate)} />
              <InfoRow label="Ngày kết thúc" value={formatDate(currentSubscription.endDate)} />
              <InfoRow label="Cửa hàng" value={currentSubscription.shopName || "—"} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Bạn chưa đăng ký gói subscription nào.</p>
          )}
        </section>
      </div>

      {changePasswordOpen ? (
        <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />
      ) : null}
    </div>
  );
}

const emptyPasswordForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

type PasswordField = keyof typeof emptyPasswordForm;

/**
 * POST /api/auth/change-password. Các rule kiểm tra dưới đây bám theo
 * `ChangePasswordRequest.java` + `AuthServiceImpl.changePassword` để báo lỗi
 * ngay tại client thay vì đợi backend trả 400.
 */
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState(emptyPasswordForm);
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Modal bị unmount khi đóng nên mật khẩu đã gõ tự mất theo state, không cần
   * dọn thủ công. Chặn đóng giữa chừng khi request đang chạy.
   */
  function requestClose() {
    if (submitting) return;
    onClose();
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [submitting, onClose]);

  function updateField(field: PasswordField, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  }

  function toggleVisibility(field: PasswordField) {
    setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function validate() {
    if (!form.oldPassword) return "Vui lòng nhập mật khẩu hiện tại.";
    if (!form.newPassword) return "Vui lòng nhập mật khẩu mới.";
    if (form.newPassword.length < 6) return "Mật khẩu mới tối thiểu phải từ 6 ký tự.";
    if (form.newPassword === form.oldPassword) {
      return "Mật khẩu mới không được trùng với mật khẩu hiện tại.";
    }
    if (form.newPassword !== form.confirmPassword) {
      return "Mật khẩu mới và xác nhận mật khẩu không khớp.";
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setSuccess(null);
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await authApi.changePassword(form);

      setForm(emptyPasswordForm);
      setSuccess("Đổi mật khẩu thành công. Hãy dùng mật khẩu mới cho lần đăng nhập sau.");
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi thử lại.");
      } else {
        setError(err instanceof Error ? err.message : "Không thể đổi mật khẩu.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-change-password-title"
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="partner-change-password-title"
                className="text-lg font-semibold text-slate-900"
              >
                Đổi mật khẩu
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Mật khẩu mới tối thiểu 6 ký tự.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={requestClose}
            disabled={submitting}
            aria-label="Đóng"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-4 p-6" onSubmit={handleSubmit}>
          <PasswordInput
            label="Mật khẩu hiện tại"
            value={form.oldPassword}
            visible={visibleFields.oldPassword}
            autoComplete="current-password"
            autoFocus
            disabled={submitting}
            onChange={(value) => updateField("oldPassword", value)}
            onToggleVisibility={() => toggleVisibility("oldPassword")}
          />
          <PasswordInput
            label="Mật khẩu mới"
            value={form.newPassword}
            visible={visibleFields.newPassword}
            autoComplete="new-password"
            disabled={submitting}
            onChange={(value) => updateField("newPassword", value)}
            onToggleVisibility={() => toggleVisibility("newPassword")}
          />
          <PasswordInput
            label="Xác nhận mật khẩu mới"
            value={form.confirmPassword}
            visible={visibleFields.confirmPassword}
            autoComplete="new-password"
            disabled={submitting}
            onChange={(value) => updateField("confirmPassword", value)}
            onToggleVisibility={() => toggleVisibility("confirmPassword")}
          />

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {success}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={submitting}
              className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {success ? "Đóng" : "Huỷ"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
              {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  visible,
  autoComplete,
  autoFocus,
  disabled,
  onChange,
  onToggleVisibility,
}: {
  label: string;
  value: string;
  visible: boolean;
  autoComplete: string;
  autoFocus?: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-500">{label}</span>
      <div className="relative mt-1">
        <input
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 transition hover:text-slate-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
