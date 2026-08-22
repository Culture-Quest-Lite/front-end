"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { PageLoading } from "@/components/app/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildTagToken } from "@/lib/tags";
import {
  formatTimeDisplayValue,
  formatTimeRangeDisplayValue,
} from "@/lib/time";
import { GoongMapPreview } from "./GoongMapPreview";
import {
  CheckInZoneEditor,
  DEFAULT_CHECK_IN_RADIUS,
  MAX_CHECK_IN_RADIUS,
  MIN_CHECK_IN_RADIUS,
  type CheckInZoneMode,
} from "./CheckInZoneEditor";
import { isPointInPolygon, parseGeoJsonToVertices } from "@/lib/geo";
import {
  configApi,
  goongApi,
  hotspotApi,
  type BackendHotspot,
  type BackendHotspotMedia,
  type CheckInRadiusConfig,
  type CreateHotspotPayload,
  type GoongPlaceSuggestion,
  type HotspotContentType,
} from "@/services/api";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Save,
  Search,
  Video,
  X,
} from "lucide-react";

type HotspotFormState = {
  hotspotName: string;
  address: string;
  description: string;
  historyInformation: string;
  latitude: string;
  longitude: string;
  zoneMode: CheckInZoneMode;
  checkInRadius: string;
  boundaryGeoJson: string;
  estimatedDurationMin: string;
  estimatedDurationMax: string;
  startTime: string;
  endTime: string;
  openingTime: string;
  closingTime: string;
  contentType: string;
  validFrom: string;
  validTo: string;
};

type HotspotMediaType = "image" | "video";

type HotspotMediaCollection = Record<HotspotMediaType, File[]>;

type CheckInRadiusSettings = Pick<
  CheckInRadiusConfig,
  "minRadius" | "maxRadius" | "defaultRadius"
>;

const FALLBACK_CHECK_IN_RADIUS_CONFIG: CheckInRadiusSettings = {
  minRadius: MIN_CHECK_IN_RADIUS,
  maxRadius: MAX_CHECK_IN_RADIUS,
  defaultRadius: DEFAULT_CHECK_IN_RADIUS,
};

const defaultSelectedMedia: HotspotMediaCollection = {
  image: [],
  video: [],
};

const DEFAULT_HOTSPOT_CONTENT_TYPE: HotspotContentType = "TEMP";
const HOTSPOT_CONTENT_TYPE_OPTIONS: ReadonlyArray<{
  value: HotspotContentType;
  label: string;
}> = [
  { value: "TEMP", label: "Có thời hạn" },
  { value: "PERMANENT", label: "Vĩnh viễn" },
];

const HOTSPOT_BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.culturequestlite.com";

function createDefaultHotspotForm(defaultRadius: number): HotspotFormState {
  return {
    hotspotName: "",
    address: "",
    description: "",
    historyInformation: "",
    latitude: "",
    longitude: "",
    zoneMode: "radius",
    checkInRadius: String(defaultRadius),
    boundaryGeoJson: "",
    estimatedDurationMin: "",
    estimatedDurationMax: "",
    startTime: "",
    endTime: "",
    openingTime: "",
    closingTime: "",
    contentType: DEFAULT_HOTSPOT_CONTENT_TYPE,
    validFrom: "",
    validTo: "",
  };
}

export default function Page() {
  return (
    <Suspense fallback={<HotspotCreatePageFallback />}>
      <HotspotCreatePageContent />
    </Suspense>
  );
}

function HotspotCreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const hasTouchedCheckInRadiusRef = useRef(false);
  const editingHotspotId = parseHotspotId(searchParams.get("id"));
  const isEditMode = editingHotspotId !== null;
  const [checkInRadiusConfig, setCheckInRadiusConfig] =
    useState<CheckInRadiusSettings>(FALLBACK_CHECK_IN_RADIUS_CONFIG);
  const [formState, setFormState] = useState<HotspotFormState>(() =>
    createDefaultHotspotForm(FALLBACK_CHECK_IN_RADIUS_CONFIG.defaultRadius),
  );
  const [isLoadingHotspot, setIsLoadingHotspot] = useState(false);
  const [loadHotspotError, setLoadHotspotError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const [createdHotspot, setCreatedHotspot] = useState<BackendHotspot | null>(
    null,
  );
  const [existingHotspotMedias, setExistingHotspotMedias] = useState<
    BackendHotspotMedia[]
  >([]);
  const [selectedMedia, setSelectedMedia] =
    useState<HotspotMediaCollection>(defaultSelectedMedia);
  const [lastSubmittedPayload, setLastSubmittedPayload] =
    useState<CreateHotspotPayload | null>(null);
  const [goongSuggestions, setGoongSuggestions] = useState<
    GoongPlaceSuggestion[]
  >([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState<string | null>(
    null,
  );
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [shouldSearchAddress, setShouldSearchAddress] = useState(false);

  const fetchCheckInRadiusConfig = useCallback(
    async () =>
      normalizeCheckInRadiusConfig(await configApi.getCheckInRadius()),
    [],
  );

  useEffect(() => {
    hasTouchedCheckInRadiusRef.current = false;
  }, [editingHotspotId, isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    let isCancelled = false;

    void fetchCheckInRadiusConfig()
      .then((config) => {
        if (isCancelled || hasTouchedCheckInRadiusRef.current) {
          return;
        }

        setCheckInRadiusConfig(config);
        setFormState((current) => {
          if (current.zoneMode !== "radius") {
            return current;
          }

          const normalizedRadius = current.checkInRadius.trim();
          if (
            normalizedRadius &&
            normalizedRadius !==
              String(FALLBACK_CHECK_IN_RADIUS_CONFIG.defaultRadius)
          ) {
            return current;
          }

          return {
            ...current,
            checkInRadius: String(config.defaultRadius),
          };
        });
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error(
            "[HotspotCreatePage] Không tải được cấu hình bán kính check-in.",
            error,
          );
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [fetchCheckInRadiusConfig, isEditMode]);

  useEffect(() => {
    if (!isEditMode || editingHotspotId === null) {
      return;
    }

    const hotspotId = editingHotspotId;
    let isCancelled = false;

    async function loadHotspotForEdit() {
      setIsLoadingHotspot(true);
      setLoadHotspotError(null);

      try {
        const [radiusConfig, response] = await Promise.all([
          fetchCheckInRadiusConfig().catch((error) => {
            console.error(
              "[HotspotCreatePage] Không tải được cấu hình bán kính check-in.",
              error,
            );
            return FALLBACK_CHECK_IN_RADIUS_CONFIG;
          }),
          hotspotApi.getHotspotById(hotspotId),
        ]);

        if (isCancelled) {
          return;
        }

        setCheckInRadiusConfig(radiusConfig);
        setFormState(
          syncFormStateWithResponse(
            createDefaultHotspotForm(radiusConfig.defaultRadius),
            response,
          ),
        );
        setExistingHotspotMedias(resolveOrderedHotspotMedias(response.medias));
        setSelectedMedia(defaultSelectedMedia);
        setCreatedHotspot(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setLoadHotspotError(
          error instanceof Error
            ? error.message
            : "Không tải được dữ liệu địa điểm cần chỉnh sửa.",
        );
      } finally {
        if (!isCancelled) {
          setIsLoadingHotspot(false);
        }
      }
    }

    void loadHotspotForEdit();

    return () => {
      isCancelled = true;
    };
  }, [editingHotspotId, fetchCheckInRadiusConfig, isEditMode]);

  useEffect(() => {
    if (!shouldSearchAddress) {
      return;
    }

    const trimmedAddress = formState.address.trim();
    let isCancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (isCancelled) {
        return;
      }

      void goongApi
        .searchPlaces(trimmedAddress)
        .then((response) => {
          if (isCancelled) {
            return;
          }

          setGoongSuggestions(response.predictions);
          setShowAddressSuggestions(true);
        })
        .catch((error) => {
          if (isCancelled) {
            return;
          }

          setGoongSuggestions([]);
          setAddressSearchError(
            error instanceof Error
              ? error.message
              : "Không thể tìm địa điểm từ Goong.",
          );
          setShowAddressSuggestions(true);
        })
        .finally(() => {
          if (!isCancelled) {
            setIsSearchingAddress(false);
          }
        });
    }, 350);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [formState.address, shouldSearchAddress]);

  const selectedFiles = [...selectedMedia.image, ...selectedMedia.video];
  const visibleExistingHotspotMedias = isEditMode ? existingHotspotMedias : [];
  const existingImageMedias =
    visibleExistingHotspotMedias.filter(isImageHotspotMedia);
  const existingVideoMedias =
    visibleExistingHotspotMedias.filter(isVideoHotspotMedia);
  const backendHotspotUrl =
    isEditMode && editingHotspotId !== null
      ? `${HOTSPOT_BACKEND_BASE_URL}/api/v1/hotspots/${editingHotspotId}`
      : `${HOTSPOT_BACKEND_BASE_URL}/api/v1/hotspots`;

  function updateField<Key extends keyof HotspotFormState>(
    field: Key,
    value: HotspotFormState[Key],
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleMapCoordinateChange(next: {
    latitude: string;
    longitude: string;
  }) {
    setFormState((current) => ({
      ...current,
      latitude: next.latitude,
      longitude: next.longitude,
    }));
  }

  function handleAddressInputChange(value: string) {
    const shouldSearch = value.trim().length >= 3;

    setAddressSearchError(null);

    setShouldSearchAddress(shouldSearch);
    setShowAddressSuggestions(shouldSearch);
    setIsSearchingAddress(shouldSearch);

    if (!shouldSearch) {
      setGoongSuggestions([]);
    }

    setFormState((current) => {
      const hasAddressChanged = current.address !== value;

      return {
        ...current,
        address: value,
        latitude: hasAddressChanged ? "" : current.latitude,
        longitude: hasAddressChanged ? "" : current.longitude,
      };
    });
  }

  async function applyGoongSuggestion(suggestion: GoongPlaceSuggestion) {
    const placeDetail = await goongApi.getPlaceDetail(suggestion.placeId);

    setFormState((current) => ({
      ...current,
      address: placeDetail.address,
      latitude: String(placeDetail.latitude),
      longitude: String(placeDetail.longitude),
    }));

    setShouldSearchAddress(false);
    setGoongSuggestions([]);
    setShowAddressSuggestions(false);
  }

  async function handleSelectGoongSuggestion(suggestion: GoongPlaceSuggestion) {
    setIsResolvingPlace(true);
    setIsSearchingAddress(false);
    setAddressSearchError(null);

    try {
      await applyGoongSuggestion(suggestion);
    } catch (error) {
      setAddressSearchError(
        error instanceof Error
          ? error.message
          : "Không thể lấy tọa độ địa điểm từ Goong.",
      );
    } finally {
      setIsResolvingPlace(false);
    }
  }

  function openMediaPicker(type: HotspotMediaType) {
    if (type === "image") {
      imageInputRef.current?.click();
      return;
    }

    videoInputRef.current?.click();
  }

  function handleMediaSelection(type: HotspotMediaType) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const nextFiles = Array.from(event.target.files ?? []).filter((file) =>
        file.type.startsWith(`${type}/`),
      );

      if (nextFiles.length === 0) {
        event.target.value = "";
        return;
      }

      setSelectedMedia((current) => ({
        ...current,
        [type]: mergeSelectedFiles(current[type], nextFiles),
      }));

      event.target.value = "";
    };
  }

  function handleRemoveSelectedMedia(type: HotspotMediaType, fileKey: string) {
    setSelectedMedia((current) => ({
      ...current,
      [type]: current[type].filter(
        (file) => buildSelectedFileKey(file) !== fileKey,
      ),
    }));
  }

  async function handleResolveAddressFromGoong() {
    const trimmedAddress = formState.address.trim();

    if (trimmedAddress.length < 3) {
      setAddressSearchError("Vui lòng nhập ít nhất 3 ký tự để tìm bằng Goong.");
      setShowAddressSuggestions(false);
      return;
    }

    setIsResolvingPlace(true);
    setIsSearchingAddress(false);
    setAddressSearchError(null);

    try {
      const response = await goongApi.searchPlaces(trimmedAddress);
      const firstSuggestion = response.predictions[0];

      if (!firstSuggestion) {
        throw new Error(
          "Goong không tìm thấy địa điểm phù hợp với địa chỉ này.",
        );
      }

      await applyGoongSuggestion(firstSuggestion);
    } catch (error) {
      setAddressSearchError(
        error instanceof Error
          ? error.message
          : "Không thể lấy tọa độ địa điểm từ Goong.",
      );
    } finally {
      setIsResolvingPlace(false);
    }
  }

  async function handleSubmitHotspot() {
    setSubmitError(null);
    setSubmitMessage(null);
    setSubmitWarning(null);

    try {
      const payload = buildCreatePayload(formState, checkInRadiusConfig);
      setLastSubmittedPayload(payload);
      await validateHotspotPayload(payload, editingHotspotId);

      setIsSubmitting(true);

      const formData = buildHotspotFormData(payload, selectedFiles);

      try {
        console.debug("FormData keys:", Array.from(formData.keys()));
      } catch {
        // ignore in environments that disallow FormData introspection
      }

      const url =
        isEditMode && editingHotspotId !== null
          ? `/api/hotspots/${editingHotspotId}`
          : `/api/hotspots`;

      const fetchResp = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        body: formData,
        credentials: "include",
      });

      const text = await fetchResp.text();
      if (!fetchResp.ok) {
        const msg = text || `Request failed with status ${fetchResp.status}`;
        throw new Error(msg);
      }

      const response = text
        ? JSON.parse(text)
        : (null as unknown as BackendHotspot);

      setCreatedHotspot(response);
      setExistingHotspotMedias(resolveOrderedHotspotMedias(response.medias));
      setSelectedMedia(defaultSelectedMedia);
      setFormState(
        syncFormStateWithResponse(
          createDefaultHotspotForm(checkInRadiusConfig.defaultRadius),
          response,
        ),
      );

      const timeMismatchWarning = buildTimeMismatchWarning(payload, response);

      if (timeMismatchWarning) {
        setSubmitWarning(timeMismatchWarning);
        toast.warn(timeMismatchWarning);
        return;
      }

      const successMessage = isEditMode
        ? "Địa điểm đã được cập nhật thành công."
        : "Địa điểm đã được tạo thành công.";

      toast.success(successMessage);
      await router.push("/curator/hotspot");
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Không thể cập nhật địa điểm."
            : "Không thể tạo địa điểm.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-slate-700">
          <Link
            href="/curator/hotspot"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
              {isEditMode ? "Chỉnh sửa địa điểm" : "Tạo địa điểm mới"}
            </h1>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
              {isEditMode
                ? "Cập nhật thông tin chi tiết của địa điểm."
                : "Nhập thông tin chi tiết và phương tiện."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full text-white"
            onClick={() => void handleSubmitHotspot()}
            disabled={
              isSubmitting ||
              isLoadingHotspot ||
              isResolvingPlace ||
              !!loadHotspotError
            }
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Đang lưu..." : "Lưu nháp"}
          </Button>
        </div>
      </div>

      {isLoadingHotspot ? (
        <PageLoading
          className="min-h-[140px] rounded-3xl border border-slate-200 shadow-none"
          spinnerClassName="h-6 w-6"
        />
      ) : null}

      {loadHotspotError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {loadHotspotError}
        </div>
      ) : null}

      {submitError ? (
        <div className="space-y-3 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <p>{submitError}</p>
          {lastSubmittedPayload ? (
            <div className="rounded-2xl border border-rose-100 bg-white/80 p-4 text-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Request preview
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isEditMode
                  ? `PUT ${backendHotspotUrl}`
                  : `POST ${backendHotspotUrl}`}
              </p>
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950/95 p-4 text-xs leading-6 text-slate-100">
                {JSON.stringify(lastSubmittedPayload, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}

      {submitMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {submitMessage}
        </div>
      ) : null}

      {submitWarning ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {submitWarning}
        </div>
      ) : null}

      <div className="w-full min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div
          className={`grid min-w-0 gap-4 ${
            createdHotspot ? "md:grid-cols-[1.8fr_1fr]" : ""
          }`}
        >
          <div className="min-w-0 flex flex-col gap-8">
            <section className="space-y-5">
              <h2 className="cq-section-title">Thông tin cơ bản</h2>
              <div className="grid min-w-0 gap-4 [&>*]:min-w-0">
                <div>
                  <label className="cq-label mb-2 block">
                    Tên địa điểm <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formState.hotspotName}
                    onChange={(event) =>
                      updateField("hotspotName", event.target.value)
                    }
                    placeholder="Hãy nhập tên địa điểm"
                    className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="cq-label mb-2 block">Địa chỉ</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={formState.address}
                      onChange={(event) =>
                        handleAddressInputChange(event.target.value)
                      }
                      onFocus={() => {
                        if (
                          formState.address.trim().length >= 3 &&
                          (goongSuggestions.length > 0 ||
                            isSearchingAddress ||
                            !!addressSearchError)
                        ) {
                          setShowAddressSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setShowAddressSuggestions(false);
                        }, 150);
                      }}
                      placeholder="Tìm địa chỉ bằng Goong"
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 pr-11 pl-11 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    {isSearchingAddress || isResolvingPlace ? (
                      <LoaderCircle className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    ) : null}
                    {showAddressSuggestions ? (
                      <div className="absolute inset-x-0 z-20 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                        {isSearchingAddress ? (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            Đang tìm địa điểm từ Goong...
                          </div>
                        ) : addressSearchError ? (
                          <div className="px-4 py-3 text-sm text-rose-700">
                            {addressSearchError}
                          </div>
                        ) : goongSuggestions.length > 0 ? (
                          <div className="max-h-72 overflow-y-auto py-2">
                            {goongSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.placeId}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() =>
                                  void handleSelectGoongSuggestion(suggestion)
                                }
                                className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                              >
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {suggestion.mainText}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {suggestion.secondaryText ||
                                      suggestion.description}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            Không tìm thấy địa điểm phù hợp trên Goong.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleResolveAddressFromGoong()}
                      disabled={
                        formState.address.trim().length < 3 ||
                        isSearchingAddress ||
                        isResolvingPlace
                      }
                      className="rounded-full px-4"
                    >
                      {isResolvingPlace ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="mr-2 h-4 w-4" />
                      )}
                      Lấy tọa độ từ Goong
                    </Button>
                    <span className="text-xs text-slate-500">
                      Nhập địa chỉ rồi bấm nút này để tự lấy kết quả phù hợp đầu
                      tiên từ Goong.
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Bạn vẫn có thể chọn thủ công từ danh sách gợi ý Goong bên
                    dưới ô địa chỉ. Nếu Goong không ra đúng kết quả, bạn vẫn có
                    thể nhập tay kinh độ và vĩ độ bên dưới.
                  </p>
                  {formState.latitude && formState.longitude ? (
                    <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
                      <MapPin className="h-3.5 w-3.5" />
                      Đã đồng bộ vĩ độ và kinh độ.
                    </p>
                  ) : null}
                  <GoongMapPreview
                    address={formState.address}
                    latitude={formState.latitude}
                    longitude={formState.longitude}
                    onCoordinateChange={handleMapCoordinateChange}
                  />
                  <CheckInZoneEditor
                    latitude={formState.latitude}
                    longitude={formState.longitude}
                    mode={formState.zoneMode}
                    checkInRadius={formState.checkInRadius}
                    minCheckInRadius={checkInRadiusConfig.minRadius}
                    maxCheckInRadius={checkInRadiusConfig.maxRadius}
                    defaultCheckInRadius={checkInRadiusConfig.defaultRadius}
                    boundaryGeoJson={formState.boundaryGeoJson}
                    onModeChange={(zoneMode) =>
                      updateField("zoneMode", zoneMode)
                    }
                    onRadiusChange={(radius) => {
                      hasTouchedCheckInRadiusRef.current = true;
                      updateField("checkInRadius", radius);
                    }}
                    onBoundaryChange={(boundary) =>
                      updateField("boundaryGeoJson", boundary)
                    }
                  />
                  {addressSearchError && !showAddressSuggestions ? (
                    <p className="mt-2 text-xs font-medium text-rose-700">
                      {addressSearchError}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="cq-label mb-2 block">Mô tả</label>
                  <textarea
                    value={formState.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Hãy nhập mô tả ngắn cho địa điểm"
                    className="h-42 w-full min-w-0 resize-none break-words rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="cq-label mb-2 block">
                    Thông tin lịch sử
                  </label>
                  <textarea
                    value={formState.historyInformation}
                    onChange={(event) =>
                      updateField("historyInformation", event.target.value)
                    }
                    placeholder="Hãy nhập thông tin lịch sử của địa điểm"
                    className="h-60 w-full min-w-0 resize-none break-words rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="cq-section-title">Thông số trải nghiệm</h2>
              <div className="grid min-w-0 gap-4 [&>*]:min-w-0">
                <div className="grid min-w-0 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                  <div>
                    <label className="cq-label mb-2 block">
                      Vĩ độ <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={formState.latitude}
                      onChange={(event) =>
                        updateField("latitude", event.target.value)
                      }
                      placeholder="Chọn địa chỉ từ Goong để lấy vĩ độ"
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">
                      Kinh độ <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={formState.longitude}
                      onChange={(event) =>
                        updateField("longitude", event.target.value)
                      }
                      placeholder="Chọn địa chỉ từ Goong để lấy kinh độ"
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid min-w-0 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                  <div>
                    <label className="cq-label mb-2 block">
                      Thời lượng tối thiểu (phút)
                      <span className="ml-1 text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formState.estimatedDurationMin}
                      onChange={(event) =>
                        updateField("estimatedDurationMin", event.target.value)
                      }
                      placeholder="Hãy nhập thời lượng tối thiểu"
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">
                      Thời lượng tối đa (phút)
                      <span className="ml-1 text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formState.estimatedDurationMax}
                      onChange={(event) =>
                        updateField("estimatedDurationMax", event.target.value)
                      }
                      placeholder="Hãy nhập thời lượng tối đa"
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid min-w-0 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                  <div>
                    <label className="cq-label mb-2 block">
                      Khung giờ lý tưởng từ
                      <span className="ml-1 text-rose-500">*</span>
                    </label>
                    <Input
                      type="time"
                      step="1"
                      value={formState.startTime}
                      onChange={(event) =>
                        updateField("startTime", event.target.value)
                      }
                      placeholder="Hãy nhập khung giờ lý tưởng bắt đầu"
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">
                      Khung giờ lý tưởng đến
                      <span className="ml-1 text-rose-500">*</span>
                    </label>
                    <Input
                      type="time"
                      step="1"
                      value={formState.endTime}
                      onChange={(event) =>
                        updateField("endTime", event.target.value)
                      }
                      placeholder="Hãy nhập khung giờ lý tưởng kết thúc"
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">Giờ mở cửa</label>
                    <Input
                      type="time"
                      step="1"
                      value={formState.openingTime}
                      onChange={(event) =>
                        updateField("openingTime", event.target.value)
                      }
                      placeholder="Hãy nhập giờ mở cửa"
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">Giờ đóng cửa</label>
                    <Input
                      type="time"
                      step="1"
                      value={formState.closingTime}
                      onChange={(event) =>
                        updateField("closingTime", event.target.value)
                      }
                      placeholder="Hãy nhập giờ đóng cửa"
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid min-w-0 gap-4 md:grid-cols-3 [&>*]:min-w-0">
                  <div>
                    <label className="cq-label mb-2 block">
                      Thời hạn
                      <span className="ml-1 text-rose-500">*</span>
                    </label>
                    <select
                      value={formState.contentType}
                      onChange={(event) =>
                        updateField("contentType", event.target.value)
                      }
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {HOTSPOT_CONTENT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">
                      Thời gian bắt đầu
                    </label>
                    <Input
                      type="datetime-local"
                      step="1"
                      value={formState.validFrom}
                      onChange={(event) =>
                        updateField("validFrom", event.target.value)
                      }
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="cq-label mb-2 block">
                      Thời gian kết thúc
                    </label>
                    <Input
                      type="datetime-local"
                      step="1"
                      value={formState.validTo}
                      onChange={(event) =>
                        updateField("validTo", event.target.value)
                      }
                      className="h-10 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="cq-section-title">Files</h2>
              <div className="grid min-w-0 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
                <div className="rounded-3xl bg-slate-50 p-6">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMediaSelection("image")}
                    className="hidden"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Hình ảnh địa điểm
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Có thể chọn nhiều ảnh cùng một lúc.
                      </p>
                    </div>
                    <ImagePlus className="h-5 w-5 text-slate-400" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-full"
                    onClick={() => openMediaPicker("image")}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Thêm ảnh
                  </Button>

                  {existingImageMedias.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Ảnh hiện có
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {existingImageMedias.map((media, index) => {
                          const fileUrl = media.fileUrl?.trim();

                          if (!fileUrl) {
                            return null;
                          }

                          return (
                            <div
                              key={media.mediaId}
                              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
                            >
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Image
                                  src={fileUrl}
                                  alt={buildBackendMediaLabel(
                                    media,
                                    `Ảnh ${index + 1}`,
                                  )}
                                  width={640}
                                  height={256}
                                  className="h-32 w-full object-cover"
                                />
                                <div className="p-3">
                                  <p className="truncate text-sm font-medium text-slate-900">
                                    {buildBackendMediaLabel(
                                      media,
                                      `Ảnh ${index + 1}`,
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Media hiện có từ hotspot
                                  </p>
                                </div>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500">
                        Ảnh hiện có sẽ được giữ nguyên. Khi chỉnh sửa hotspot,
                        hệ thống chỉ tải thêm ảnh mới.
                      </p>
                    </div>
                  ) : null}

                  {selectedMedia.image.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {selectedMedia.image.map((file) => {
                        const fileKey = buildSelectedFileKey(file);

                        return (
                          <div
                            key={fileKey}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-slate-900">
                                {file.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatUploadFileSize(file.size)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveSelectedMedia("image", fileKey)
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              aria-label={`Xóa ảnh ${file.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-400">
                      {existingImageMedias.length > 0
                        ? "Chưa chọn thêm ảnh mới."
                        : "Chưa có ảnh nào được chọn."}
                    </p>
                  )}
                </div>

                <div className="rounded-3xl bg-slate-50 p-6">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleMediaSelection("video")}
                    className="hidden"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Video địa điểm
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Chọn một hoặc nhiều video cùng lúc.
                      </p>
                    </div>
                    <Video className="h-5 w-5 text-slate-400" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-full"
                    onClick={() => openMediaPicker("video")}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Thêm video
                  </Button>

                  {existingVideoMedias.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Video hiện có
                      </p>
                      <div className="space-y-3">
                        {existingVideoMedias.map((media, index) => {
                          const fileUrl = media.fileUrl?.trim();

                          if (!fileUrl) {
                            return null;
                          }

                          return (
                            <div
                              key={media.mediaId}
                              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                            >
                              <video
                                src={fileUrl}
                                controls
                                preload="metadata"
                                className="h-40 w-full bg-slate-950 object-cover"
                              />
                              <div className="flex items-center justify-between gap-3 p-3">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-slate-900">
                                    {buildBackendMediaLabel(
                                      media,
                                      `Video ${index + 1}`,
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Media hiện có từ hotspot
                                  </p>
                                </div>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  Mở file
                                </a>
                                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-400">
                                  Giữ media cũ
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500">
                        Video hiện có sẽ được giữ nguyên. Khi chỉnh sửa hotspot,
                        hệ thống chỉ tải thêm video mới.
                      </p>
                    </div>
                  ) : null}

                  {selectedMedia.video.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {selectedMedia.video.map((file) => {
                        const fileKey = buildSelectedFileKey(file);

                        return (
                          <div
                            key={fileKey}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-slate-900">
                                {file.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatUploadFileSize(file.size)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveSelectedMedia("video", fileKey)
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              aria-label={`Xóa video ${file.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-400">
                      {existingVideoMedias.length > 0
                        ? "Chưa chọn thêm video mới."
                        : "Chưa có video nào được chọn."}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {createdHotspot ? (
            <div className="space-y-4">
              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="cq-card-title">Kết quả từ dữ liệu trả về</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-700">
                  <ResultRow
                    label="Địa điểm"
                    value={
                      createdHotspot.hotspotId
                        ? String(createdHotspot.hotspotId)
                        : ""
                    }
                  />
                  <ResultRow
                    label="Trạng thái"
                    value={createdHotspot.status?.trim() || "Chưa có dữ liệu"}
                  />
                  <ResultRow
                    label="Tạo bởi"
                    value={
                      typeof createdHotspot.createByUserId === "number"
                        ? String(createdHotspot.createByUserId)
                        : "Chưa có dữ liệu"
                    }
                  />
                  <ResultRow
                    label="Tạo lúc"
                    value={formatDateTime(createdHotspot.createdAt)}
                  />
                  <ResultRow
                    label="Cập nhật lúc"
                    value={formatDateTime(createdHotspot.updatedAt)}
                  />
                  <ResultRow
                    label="Toạ độ"
                    value={buildCoordinatesLabel(createdHotspot)}
                  />
                  <ResultRow
                    label="Thời lượng"
                    value={buildDurationLabel(createdHotspot)}
                  />
                  <ResultRow
                    label="Khung giờ lý tưởng"
                    value={buildTimeWindowLabel(createdHotspot)}
                  />
                  <ResultRow
                    label="Giờ mở cửa"
                    value={buildOpeningHoursLabel(createdHotspot)}
                  />
                  <ResultRow
                    label="Thời hạn"
                    value={formatHotspotContentTypeLabel(
                      createdHotspot.contentType,
                    )}
                  />
                  <ResultRow
                    label="Hiệu lực"
                    value={buildContentValidityLabel(createdHotspot)}
                  />
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Thẻ trả về
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {createdHotspot.tags && createdHotspot.tags.length > 0 ? (
                        createdHotspot.tags.map((tag) => (
                          <span
                            key={tag.tagId}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            #{buildTagToken(tag.tagName)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">
                          Chưa có dữ liệu thẻ.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HotspotCreatePageFallback() {
  return <PageLoading className="min-h-[calc(100vh-8rem)]" />;
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function mergeSelectedFiles(currentFiles: File[], nextFiles: File[]) {
  const mergedFiles = [...currentFiles];

  nextFiles.forEach((file) => {
    const fileKey = buildSelectedFileKey(file);

    if (!mergedFiles.some((item) => buildSelectedFileKey(item) === fileKey)) {
      mergedFiles.push(file);
    }
  });

  return mergedFiles;
}

function buildSelectedFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatUploadFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageHotspotMedia(media?: BackendHotspotMedia) {
  if (!media?.fileUrl) {
    return false;
  }

  const mediaType = media.mediaType?.trim().toUpperCase();
  const mimeType = media.mimeType?.trim().toLowerCase();

  return (
    mediaType === "IMAGE" ||
    mimeType?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|avif)$/i.test(media.fileUrl)
  );
}

function isVideoHotspotMedia(media?: BackendHotspotMedia) {
  if (!media?.fileUrl) {
    return false;
  }

  const mediaType = media.mediaType?.trim().toUpperCase();
  const mimeType = media.mimeType?.trim().toLowerCase();

  return (
    mediaType === "VIDEO" ||
    mimeType?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov)$/i.test(media.fileUrl)
  );
}

function resolveOrderedHotspotMedias(medias?: BackendHotspotMedia[]) {
  const orderedMedias = [...(medias ?? [])].sort((mediaA, mediaB) => {
    const displayOrderDiff =
      (mediaA.displayOrder ?? Number.MAX_SAFE_INTEGER) -
      (mediaB.displayOrder ?? Number.MAX_SAFE_INTEGER);

    if (displayOrderDiff !== 0) {
      return displayOrderDiff;
    }

    return mediaA.mediaId - mediaB.mediaId;
  });

  const seenMediaKeys = new Set<string>();

  return orderedMedias.filter((media) => {
    const mediaKey = buildHotspotMediaKey(media);

    if (seenMediaKeys.has(mediaKey)) {
      return false;
    }

    seenMediaKeys.add(mediaKey);
    return true;
  });
}

function buildBackendMediaLabel(
  media: BackendHotspotMedia,
  fallbackLabel: string,
) {
  const normalizedFileName = media.fileName?.trim();

  return normalizedFileName || fallbackLabel;
}

function buildCreatePayload(
  formState: HotspotFormState,
  checkInRadiusConfig: CheckInRadiusSettings,
): CreateHotspotPayload {
  const hotspotName = formState.hotspotName.trim();
  const address = formState.address.trim();
  const description = formState.description.trim();
  const historyInformation = formState.historyInformation.trim();
  const contentType = formState.contentType.trim().toUpperCase();

  if (!hotspotName) {
    throw new Error("Vui lòng nhập tên địa điểm.");
  }

  if (!contentType) {
    throw new Error("Vui lòng nhập loại nội dung.");
  }

  const estimatedDurationMin = parseIntegerField(
    "thời lượng tối thiểu",
    formState.estimatedDurationMin,
  );
  const estimatedDurationMax = parseIntegerField(
    "thời lượng tối đa",
    formState.estimatedDurationMax,
  );

  if (estimatedDurationMin > estimatedDurationMax) {
    throw new Error(
      "Thời lượng tối thiểu không được lớn hơn thời lượng tối đa.",
    );
  }

  const latitude = parseDecimalField("latitude", formState.latitude);
  const longitude = parseDecimalField("longitude", formState.longitude);

  const payload: CreateHotspotPayload = {
    hotspotName,
    latitude,
    longitude,
    estimatedDurationMin,
    estimatedDurationMax,
    startTime: normalizeTimeForApi("thời gian bắt đầu", formState.startTime),
    endTime: normalizeTimeForApi("thời gian kết thúc", formState.endTime),
    contentType,
  };

  applyCheckInZoneToPayload(
    payload,
    formState,
    { latitude, longitude },
    checkInRadiusConfig,
  );

  if (address) {
    payload.address = address;
  }

  if (description) {
    payload.description = description;
  }

  if (historyInformation) {
    payload.historyInformation = historyInformation;
  }

  const openingTime = normalizeOptionalTimeForApi(
    "giờ mở cửa",
    formState.openingTime,
  );
  const closingTime = normalizeOptionalTimeForApi(
    "giờ đóng cửa",
    formState.closingTime,
  );

  if (openingTime) {
    payload.openingTime = openingTime;
  }

  if (closingTime) {
    payload.closingTime = closingTime;
  }

  const validFrom = normalizeOptionalDateTimeForApi(
    "thời gian hiệu lực bắt đầu",
    formState.validFrom,
  );
  const validTo = normalizeOptionalDateTimeForApi(
    "thời gian hiệu lực kết thúc",
    formState.validTo,
  );

  if (validFrom) {
    payload.validFrom = validFrom;
  }

  if (validTo) {
    payload.validTo = validTo;
  }

  return payload;
}

/**
 * Gắn vùng check-in vào payload. Chế độ vẽ ưu tiên polygon; nếu chưa đủ 3 đỉnh
 * thì báo lỗi ngay thay vì để backend trả 400.
 */
function applyCheckInZoneToPayload(
  payload: CreateHotspotPayload,
  formState: HotspotFormState,
  center: { latitude: number; longitude: number },
  checkInRadiusConfig: CheckInRadiusSettings,
) {
  if (formState.zoneMode === "polygon") {
    const vertices = parseGeoJsonToVertices(formState.boundaryGeoJson);

    if (vertices.length < 3) {
      throw new Error(
        "Vui lòng vẽ ranh giới với ít nhất 3 đỉnh, hoặc chuyển sang chế độ bán kính.",
      );
    }

    if (!isPointInPolygon(center, vertices)) {
      throw new Error("Toạ độ hotspot phải nằm trong ranh giới đã vẽ.");
    }

    payload.boundaryGeoJson = formState.boundaryGeoJson.trim();
    return;
  }

  const checkInRadius = parseIntegerField(
    "bán kính check-in",
    formState.checkInRadius,
  );

  if (
    checkInRadius < checkInRadiusConfig.minRadius ||
    checkInRadius > checkInRadiusConfig.maxRadius
  ) {
    throw new Error(
      `Bán kính check-in phải nằm trong khoảng ${checkInRadiusConfig.minRadius}m đến ${checkInRadiusConfig.maxRadius}m.`,
    );
  }

  payload.checkInRadius = checkInRadius;
  // Gửi chuỗi rỗng để backend xoá polygon cũ khi curator đổi về chế độ bán kính.
  payload.boundaryGeoJson = "";
}

function parseDecimalField(label: string, value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`Vui lòng nhập ${label}.`);
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isFinite(parsedValue)) {
    throw new Error(`${label} không hợp lệ.`);
  }

  return parsedValue;
}

function parseIntegerField(label: string, value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`Vui lòng nhập ${label}.`);
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isInteger(parsedValue)) {
    throw new Error(`${label} phải là số nguyên.`);
  }

  return parsedValue;
}

function buildHotspotFormData(payload: CreateHotspotPayload, files: File[]) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
      return;
    }

    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  files.forEach((file) => formData.append("files", file));

  return formData;
}

function buildHotspotMediaKey(media: BackendHotspotMedia) {
  const normalizedUrl = media.fileUrl?.trim().toLowerCase();

  if (normalizedUrl) {
    return normalizedUrl;
  }

  return `media-id:${media.mediaId}`;
}

async function validateHotspotPayload(
  payload: CreateHotspotPayload,
  editingHotspotId: number | null,
) {
  validateCoordinateRange(payload.latitude, payload.longitude);
  validateOptionalDateTimeWindow(
    "thời gian hiệu lực",
    payload.validFrom,
    payload.validTo,
  );
  validateTimeWindow(
    "khung giờ trải nghiệm",
    payload.startTime,
    payload.endTime,
  );
  validateOptionalTimeWindow(
    "giờ mở cửa",
    payload.openingTime,
    payload.closingTime,
  );

  const existingHotspots = await hotspotApi.getHotspots();
  const normalizedName = normalizeText(payload.hotspotName);
  const normalizedAddress = normalizeText(payload.address ?? "");

  const duplicateHotspot = existingHotspots.find((hotspot) => {
    if (editingHotspotId !== null && hotspot.hotspotId === editingHotspotId) {
      return false;
    }

    const hasSameName =
      normalizedName &&
      normalizeText(hotspot.hotspotName ?? "") === normalizedName;
    const hasSameAddress =
      normalizedAddress &&
      normalizeText(hotspot.address ?? "") === normalizedAddress;
    const hasSameCoordinates =
      isSameCoordinate(hotspot.latitude, payload.latitude) &&
      isSameCoordinate(hotspot.longitude, payload.longitude);

    return hasSameName || hasSameAddress || hasSameCoordinates;
  });

  if (duplicateHotspot) {
    throw new Error(
      `Địa điểm có vẻ đã tồn tại trên hệ thống: ${duplicateHotspot.hotspotName ?? `#${duplicateHotspot.hotspotId}`}. Vui lòng kiểm tra lại tên, địa chỉ hoặc tọa độ trước khi tạo mới.`,
    );
  }
}

function normalizeTimeForApi(label: string, value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`Vui lòng nhập ${label}.`);
  }

  return normalizeTimeValue(label, normalizedValue);
}

function normalizeOptionalTimeForApi(label: string, value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  return normalizeTimeValue(label, normalizedValue);
}

function normalizeOptionalDateTimeForApi(label: string, value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  return normalizeDateTimeValue(label, normalizedValue);
}

function normalizeTimeValue(label: string, normalizedValue: string) {
  if (/^\d{2}:\d{2}$/.test(normalizedValue)) {
    return `${normalizedValue}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  throw new Error(`${label} không đúng định dạng HH:mm hoặc HH:mm:ss.`);
}

function normalizeDateTimeValue(label: string, normalizedValue: string) {
  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${label} không đúng định dạng ngày giờ.`);
  }

  return formatDateTimeOffsetValue(parsedDate);
}

function validateOptionalTimeWindow(
  label: string,
  startTime?: string,
  endTime?: string,
) {
  if (!startTime && !endTime) {
    return;
  }

  if (!startTime || !endTime) {
    throw new Error(
      `${label} không hợp lệ: vui lòng nhập đủ thời gian bắt đầu và kết thúc.`,
    );
  }

  validateTimeWindow(label, startTime, endTime);
}

function validateOptionalDateTimeWindow(
  label: string,
  startTime?: string,
  endTime?: string,
) {
  if (!startTime && !endTime) {
    return;
  }

  if (!startTime || !endTime) {
    throw new Error(
      `${label} không hợp lệ: vui lòng nhập đủ thời gian bắt đầu và kết thúc.`,
    );
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error(`${label} không đúng định dạng ngày giờ.`);
  }

  if (startDate.getTime() >= endDate.getTime()) {
    throw new Error(
      `${label} không hợp lệ: thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.`,
    );
  }
}

function syncFormStateWithResponse(
  current: HotspotFormState,
  response: BackendHotspot,
): HotspotFormState {
  // Ranh giới/bán kính phải được nạp lại khi mở form sửa, nếu không lần Lưu tiếp
  // theo sẽ ghi đè vùng check-in hiện có bằng giá trị mặc định.
  const boundaryGeoJson = response.boundaryGeoJson?.trim() || "";
  const hasBoundary = parseGeoJsonToVertices(boundaryGeoJson).length >= 3;

  return {
    ...current,
    zoneMode: hasBoundary ? "polygon" : current.zoneMode,
    checkInRadius: formatNumberInputValue(
      response.checkInRadius,
      current.checkInRadius,
    ),
    boundaryGeoJson: boundaryGeoJson || current.boundaryGeoJson,
    hotspotName: response.hotspotName?.trim() || current.hotspotName,
    address: response.address?.trim() || current.address,
    description: response.description?.trim() || current.description,
    historyInformation:
      response.historyInformation?.trim() || current.historyInformation,
    latitude: formatNumberInputValue(response.latitude, current.latitude),
    longitude: formatNumberInputValue(response.longitude, current.longitude),
    estimatedDurationMin: formatNumberInputValue(
      response.estimatedDurationMin,
      current.estimatedDurationMin,
    ),
    estimatedDurationMax: formatNumberInputValue(
      response.estimatedDurationMax,
      current.estimatedDurationMax,
    ),
    startTime: formatTimeInputValue(response.startTime, current.startTime),
    endTime: formatTimeInputValue(response.endTime, current.endTime),
    openingTime: formatTimeInputValue(
      response.openingTime,
      current.openingTime,
    ),
    closingTime: formatTimeInputValue(
      response.closingTime,
      current.closingTime,
    ),
    contentType: normalizeHotspotContentTypeValue(
      response.contentType,
      current.contentType,
    ),
    validFrom: formatDateTimeInputValue(response.validFrom, current.validFrom),
    validTo: formatDateTimeInputValue(response.validTo, current.validTo),
  };
}

function formatNumberInputValue(
  value: number | null | undefined,
  fallback: string,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : fallback;
}

function formatTimeInputValue(
  value: string | null | undefined,
  fallback: string,
) {
  const normalizedValue = formatTimeDisplayValue(value);
  return /^\d{2}:\d{2}$/.test(normalizedValue) ? normalizedValue : fallback;
}

function formatDateTimeInputValue(
  value: string | null | undefined,
  fallback: string,
) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return fallback;
  }

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return formatDateTimeLocalInputValue(parsedDate);
}

function formatDateTime(value: string | undefined) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function buildCoordinatesLabel(hotspot: BackendHotspot) {
  if (
    typeof hotspot.latitude !== "number" ||
    !Number.isFinite(hotspot.latitude) ||
    typeof hotspot.longitude !== "number" ||
    !Number.isFinite(hotspot.longitude)
  ) {
    return "Chưa có dữ liệu";
  }

  return `${hotspot.latitude}, ${hotspot.longitude}`;
}

function buildDurationLabel(hotspot: BackendHotspot) {
  if (
    typeof hotspot.estimatedDurationMin !== "number" ||
    typeof hotspot.estimatedDurationMax !== "number"
  ) {
    return "Chưa có dữ liệu";
  }

  return `${hotspot.estimatedDurationMin} - ${hotspot.estimatedDurationMax} phút`;
}

function buildTimeWindowLabel(hotspot: BackendHotspot) {
  return (
    formatTimeRangeDisplayValue(hotspot.startTime, hotspot.endTime) ||
    "Chưa có dữ liệu"
  );
}

function buildOpeningHoursLabel(hotspot: BackendHotspot) {
  return (
    formatTimeRangeDisplayValue(hotspot.openingTime, hotspot.closingTime) ||
    "Chưa có dữ liệu"
  );
}

function buildTimeMismatchWarning(
  payload: CreateHotspotPayload,
  response: BackendHotspot,
) {
  const mismatchMessages: string[] = [];
  const submittedBestTime = formatTimeRangeDisplayValue(
    payload.startTime,
    payload.endTime,
  );
  const savedBestTime = formatTimeRangeDisplayValue(
    response.startTime,
    response.endTime,
  );

  if (submittedBestTime !== savedBestTime) {
    mismatchMessages.push(
      `Khung giờ lý tưởng đã gửi là ${submittedBestTime || "trống"} nhưng backend trả về ${savedBestTime || "trống"}.`,
    );
  }

  const submittedOpeningHours = formatTimeRangeDisplayValue(
    payload.openingTime,
    payload.closingTime,
  );

  if (submittedOpeningHours) {
    const savedOpeningHours = formatTimeRangeDisplayValue(
      response.openingTime,
      response.closingTime,
    );

    if (submittedOpeningHours !== savedOpeningHours) {
      mismatchMessages.push(
        `Giờ mở/đóng cửa đã gửi là ${submittedOpeningHours} nhưng backend trả về ${savedOpeningHours || "trống"}.`,
      );
    }
  }

  return mismatchMessages.join(" ");
}

function buildContentValidityLabel(hotspot: BackendHotspot) {
  if (!hotspot.validFrom || !hotspot.validTo) {
    return "Chưa có dữ liệu";
  }

  return `${formatDateTime(hotspot.validFrom)} - ${formatDateTime(hotspot.validTo)}`;
}

function formatHotspotContentTypeLabel(value: string | null | undefined) {
  const normalizedValue = value?.trim().toUpperCase();

  if (!normalizedValue) {
    return "Chưa có dữ liệu";
  }

  if (normalizedValue === "TEMP") {
    return "Có thời hạn";
  }

  if (normalizedValue === "PERMANENT" || normalizedValue === "PERM") {
    return "Vĩnh viễn";
  }

  return normalizedValue;
}

function parseHotspotId(value: string | null) {
  if (!value) {
    return null;
  }

  const hotspotId = Number(value.trim());
  if (!Number.isInteger(hotspotId) || hotspotId <= 0) {
    return null;
  }

  return hotspotId;
}

function normalizeCheckInRadiusConfig(
  response?: Partial<CheckInRadiusConfig> | null,
): CheckInRadiusSettings {
  const minRadius = normalizePositiveInteger(
    response?.minRadius,
    FALLBACK_CHECK_IN_RADIUS_CONFIG.minRadius,
  );
  const maxRadius = Math.max(
    normalizePositiveInteger(
      response?.maxRadius,
      FALLBACK_CHECK_IN_RADIUS_CONFIG.maxRadius,
    ),
    minRadius,
  );
  const defaultRadius = clampNumber(
    normalizePositiveInteger(
      response?.defaultRadius,
      FALLBACK_CHECK_IN_RADIUS_CONFIG.defaultRadius,
    ),
    minRadius,
    maxRadius,
  );

  return {
    minRadius,
    maxRadius,
    defaultRadius,
  };
}

function normalizePositiveInteger(
  value: number | null | undefined,
  fallback: number,
) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatDateTimeLocalInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function formatDateTimeOffsetValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffsetMinutes / 60)).padStart(
    2,
    "0",
  );
  const offsetRemainderMinutes = String(
    absoluteOffsetMinutes % 60,
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${sign}${offsetHours}:${offsetRemainderMinutes}`;
}

function normalizeHotspotContentTypeValue(
  value: string | null | undefined,
  fallback: string,
) {
  const normalizedValue = value?.trim().toUpperCase();

  if (!normalizedValue) {
    return fallback;
  }

  if (normalizedValue === "PERM") {
    return "PERMANENT";
  }

  return normalizedValue;
}

function stripVietnameseAccents(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeText(value: string) {
  return stripVietnameseAccents(value).toLowerCase().trim();
}

function isSameCoordinate(
  source: number | null | undefined,
  target: number,
  tolerance = 0.000001,
) {
  return (
    typeof source === "number" &&
    Number.isFinite(source) &&
    Math.abs(source - target) <= tolerance
  );
}

function validateCoordinateRange(latitude: number, longitude: number) {
  if (latitude < -90 || latitude > 90) {
    throw new Error("Vĩ độ phải nằm trong khoảng từ -90 đến 90.");
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error("Kinh độ phải nằm trong khoảng từ -180 đến 180.");
  }
}

function validateTimeWindow(label: string, startTime: string, endTime: string) {
  if (startTime >= endTime) {
    throw new Error(
      `${label} không hợp lệ: thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.`,
    );
  }
}
