"use client";

import { Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  startRipening,
  type StartRipeningResult,
} from "@/features/ripening/actions";
import {
  ripeningInputSchema,
  type RecentRipeningSetting,
  type RipeningFormOptions,
  type RipeningRuleOption,
  type SortingRipeningOption,
  type StaffOption,
} from "@/features/ripening/schema";

type RipeningFormProps = {
  currentStaff: StaffOption | null;
  options: RipeningFormOptions;
  defaultDate: string;
  defaultTime: string;
};

type AllocationDraft = {
  key: number;
  sortingLogId: string;
  weightKg: string;
};

type AllocationErrors = Record<number, string | undefined>;

const NEW_LOCATION = "__new__";
const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-3.5 text-[15px] shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";
const textareaClass =
  "min-h-24 w-full resize-y rounded-xl border border-input bg-card px-3.5 py-2.5 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";
const labelClass = "text-[13px] font-bold text-kiwi-ink";
const initialState: StartRipeningResult | null = null;

function Field({
  label,
  htmlFor,
  optional,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className={labelClass}>
        {label}
        {optional && (
          <span className="ml-1 font-medium text-muted-foreground">（任意）</span>
        )}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function formatWeight(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

function formatDate(value: string) {
  return value.replaceAll("-", "/");
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function sourceLabel(source: SortingRipeningOption) {
  return `${formatDate(source.sortingDate)}・${source.title}（残 ${formatWeight(source.availableWeightKg)} kg）`;
}

function getAllocationOverageError(
  allocation: AllocationDraft,
  sortingSources: SortingRipeningOption[],
) {
  // 選択時に取得した使用可能量と比較し、入力した時点で具体的な上限を伝える。
  const source = sortingSources.find(
    (candidate) => candidate.id === allocation.sortingLogId,
  );
  const weightKg = Number.parseFloat(allocation.weightKg);

  if (
    !source ||
    !Number.isFinite(weightKg) ||
    weightKg <= source.availableWeightKg
  ) {
    return undefined;
  }

  return `使用可能な${formatWeight(source.availableWeightKg)} kgを超えています。`;
}

type DefaultSource = "master" | "master-and-recent" | "recent" | "none";

function resolveRipeningDefaults(
  source: SortingRipeningOption | undefined,
  startDate: string,
  rules: RipeningRuleOption[],
  recentSettings: RecentRipeningSetting[],
) {
  const rule = source
    ? rules.find(
        (candidate) =>
          candidate.varietyId === source.varietyId &&
          candidate.startMonth === Number(startDate.slice(5, 7)),
      )
    : undefined;
  const recentSetting = source
    ? recentSettings.find(
        (candidate) => candidate.varietyId === source.varietyId,
      )
    : undefined;
  const candidates = [
    [rule?.ethyleneTemperatureC, recentSetting?.ethyleneTemperatureC],
    [rule?.ethyleneDurationHours, recentSetting?.ethyleneDurationHours],
    [rule?.restingTemperatureC, recentSetting?.restingTemperatureC],
    [rule?.restingDurationHours, recentSetting?.restingDurationHours],
  ] as const;
  const hasMasterValue = candidates.some(([master]) => master != null);
  const hasCompleteMaster = candidates.every(([master]) => master != null);
  const usesRecentValue = candidates.some(
    ([master, recent]) => master == null && recent != null,
  );
  const sourceType: DefaultSource = hasMasterValue
    ? usesRecentValue
      ? "master-and-recent"
      : "master"
    : usesRecentValue
      ? "recent"
      : "none";

  return {
    rule,
    recentSetting,
    sourceType,
    hasCompleteMaster,
    ethyleneTemperatureC:
      rule?.ethyleneTemperatureC ?? recentSetting?.ethyleneTemperatureC ?? null,
    ethyleneDurationHours:
      rule?.ethyleneDurationHours ?? recentSetting?.ethyleneDurationHours ?? null,
    restingTemperatureC:
      rule?.restingTemperatureC ?? recentSetting?.restingTemperatureC ?? null,
    restingDurationHours:
      rule?.restingDurationHours ?? recentSetting?.restingDurationHours ?? null,
  };
}

export function RipeningForm({
  currentStaff,
  options,
  defaultDate,
  defaultTime,
}: RipeningFormProps) {
  const { locations, rules, recentSettings, sortingSources } = options;
  const initialSource = sortingSources[0];
  const initialDefaults = resolveRipeningDefaults(
    initialSource,
    defaultDate,
    rules,
    recentSettings,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const nextAllocationKey = useRef(2);
  const isSubmissionConfirmed = useRef(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [staffName, setStaffName] = useState(currentStaff?.name ?? "");
  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultTime);
  const recentLocationId = initialDefaults.recentSetting?.locationId;
  const [locationChoice, setLocationChoice] = useState(
    recentLocationId && locations.some((location) => location.id === recentLocationId)
      ? recentLocationId
      : locations.length === 0
      ? NEW_LOCATION
      : locations.length === 1
        ? locations[0].id
        : "",
  );
  const [newLocationName, setNewLocationName] = useState("");
  const [allocations, setAllocations] = useState<AllocationDraft[]>([
    {
      key: 1,
      sortingLogId: initialSource?.id ?? "",
      weightKg: initialSource?.availableWeightKg.toString() ?? "",
    },
  ]);
  const [allocationErrors, setAllocationErrors] = useState<AllocationErrors>({});
  const [ethyleneTemperatureC, setEthyleneTemperatureC] = useState(
    initialDefaults.ethyleneTemperatureC?.toString() ?? "",
  );
  const [ethyleneProcessingHours, setEthyleneProcessingHours] = useState(
    initialDefaults.ethyleneDurationHours?.toString() ?? "",
  );
  const [restingTemperatureC, setRestingTemperatureC] = useState(
    initialDefaults.restingTemperatureC?.toString() ?? "",
  );
  const [restingDurationHours, setRestingDurationHours] = useState(
    initialDefaults.restingDurationHours?.toString() ?? "",
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saveAsStandard, setSaveAsStandard] = useState(
    !initialDefaults.hasCompleteMaster,
  );
  const [notes, setNotes] = useState("");
  const [isMetaOpen, setIsMetaOpen] = useState(false);

  async function submitRipening(
    previousState: StartRipeningResult | null,
    formData: FormData,
  ) {
    const result = await startRipening(previousState, formData);
    if (result.ok) {
      formRef.current?.reset();
      setStartDate(defaultDate);
      setStartTime(defaultTime);
      setStaffName((current) => current.trim());
      setAllocations([
        {
          key: nextAllocationKey.current++,
          sortingLogId: "",
          weightKg: "",
        },
      ]);
      setAllocationErrors({});
      setEthyleneTemperatureC("");
      setEthyleneProcessingHours("");
      setRestingTemperatureC("");
      setRestingDurationHours("");
      setNotificationsEnabled(true);
      setSaveAsStandard(true);
      setNewLocationName("");
      setNotes("");
      setIsMetaOpen(false);
      setIsCompleteOpen(true);
    } else if ("fieldErrors" in result) {
      if (result.fieldErrors.notes) setIsMetaOpen(true);
    }
    return result;
  }

  const [state, formAction, isPending] = useActionState(
    submitRipening,
    initialState,
  );
  const fieldErrors =
    state && !state.ok && "fieldErrors" in state
      ? state.fieldErrors
      : undefined;

  const firstSource = sortingSources.find(
    (source) => source.id === allocations[0]?.sortingLogId,
  );
  const selectedDefaults = resolveRipeningDefaults(
    firstSource,
    startDate,
    rules,
    recentSettings,
  );
  const selectedSourceIds = new Set(
    allocations.map((allocation) => allocation.sortingLogId).filter(Boolean),
  );
  const totalWeightKg = allocations.reduce((total, allocation) => {
    const value = Number.parseFloat(allocation.weightKg);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
  const canAddAllocation =
    firstSource &&
    sortingSources.some(
      (source) =>
        source.varietyId === firstSource.varietyId &&
        !selectedSourceIds.has(source.id),
    );

  function applyDefaults(
    sourceId: string,
    date: string,
    applyRecentLocation = false,
  ) {
    const source = sortingSources.find((candidate) => candidate.id === sourceId);
    const defaults = resolveRipeningDefaults(
      source,
      date,
      rules,
      recentSettings,
    );

    setEthyleneTemperatureC(defaults.ethyleneTemperatureC?.toString() ?? "");
    setEthyleneProcessingHours(defaults.ethyleneDurationHours?.toString() ?? "");
    setRestingTemperatureC(defaults.restingTemperatureC?.toString() ?? "");
    setRestingDurationHours(defaults.restingDurationHours?.toString() ?? "");
    setSaveAsStandard(!defaults.hasCompleteMaster);
    if (
      applyRecentLocation &&
      defaults.recentSetting?.locationId &&
      locations.some((location) => location.id === defaults.recentSetting?.locationId)
    ) {
      setLocationChoice(defaults.recentSetting.locationId);
    }
  }

  function handleStartDateChange(nextDate: string) {
    setStartDate(nextDate);
    applyDefaults(allocations[0]?.sortingLogId ?? "", nextDate);
  }

  function handleSourceChange(index: number, sortingLogId: string) {
    const source = sortingSources.find((candidate) => candidate.id === sortingLogId);
    const allocationKey = allocations[index]?.key;
    setAllocations((current) => {
      const next = current.map((allocation, allocationIndex) =>
        allocationIndex === index
          ? {
              ...allocation,
              sortingLogId,
              weightKg: source ? source.availableWeightKg.toString() : "",
            }
          : allocation,
      );
      return index === 0 ? [next[0]] : next;
    });
    if (index === 0) {
      setAllocationErrors({});
    } else if (allocationKey != null) {
      setAllocationErrors((current) => ({
        ...current,
        [allocationKey]: undefined,
      }));
    }
    if (index === 0) applyDefaults(sortingLogId, startDate, true);
  }

  function handleWeightChange(index: number, weightKg: string) {
    const currentAllocation = allocations[index];
    const nextAllocation = currentAllocation
      ? { ...currentAllocation, weightKg }
      : undefined;
    setAllocations((current) =>
      current.map((allocation, allocationIndex) =>
        allocationIndex === index ? { ...allocation, weightKg } : allocation,
      ),
    );
    // 入力のたびに判定し、超過した瞬間の表示と修正した瞬間の解除を同じ処理で行う。
    if (nextAllocation) {
      setAllocationErrors((current) => ({
        ...current,
        [nextAllocation.key]: getAllocationOverageError(
          nextAllocation,
          sortingSources,
        ),
      }));
    }
  }

  function addAllocation() {
    setAllocations((current) => [
      ...current,
      {
        key: nextAllocationKey.current++,
        sortingLogId: "",
        weightKg: "",
      },
    ]);
  }

  function removeAllocation(index: number) {
    const removedKey = allocations[index]?.key;
    setAllocations((current) =>
      current.filter((_, allocationIndex) => allocationIndex !== index),
    );
    if (removedKey != null) {
      setAllocationErrors((current) => {
        const next = { ...current };
        delete next[removedKey];
        return next;
      });
    }
  }

  function sourcesForAllocation(index: number) {
    const currentId = allocations[index]?.sortingLogId;
    return sortingSources.filter((source) => {
      const isSameVariety =
        !firstSource || index === 0 || source.varietyId === firstSource.varietyId;
      const isUnused = !selectedSourceIds.has(source.id) || source.id === currentId;
      return isSameVariety && isUnused;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (isSubmissionConfirmed.current) {
      isSubmissionConfirmed.current = false;
      return;
    }

    const nextAllocationErrors = Object.fromEntries(
      allocations.map((allocation) => [
        allocation.key,
        getAllocationOverageError(allocation, sortingSources),
      ]),
    ) as AllocationErrors;
    if (Object.values(nextAllocationErrors).some(Boolean)) {
      event.preventDefault();
      setAllocationErrors(nextAllocationErrors);
      return;
    }

    const parsed = ripeningInputSchema.safeParse({
      staffName,
      startDate,
      startTime,
      locationId: locationChoice === NEW_LOCATION ? "" : locationChoice,
      newLocationName:
        locationChoice === NEW_LOCATION ? newLocationName : "",
      ethyleneTemperatureC,
      ethyleneProcessingHours,
      restingTemperatureC,
      restingDurationHours,
      notificationsEnabled,
      saveAsStandard,
      notes,
      items: allocations.map((allocation) => ({
        sortingLogId: allocation.sortingLogId,
        weightKg: allocation.weightKg,
      })),
    });
    if (!parsed.success) return;

    event.preventDefault();
    setIsConfirmOpen(true);
  }

  function confirmSubmission() {
    isSubmissionConfirmed.current = true;
    setIsConfirmOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-4"
      noValidate
    >
      {!currentStaff && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          担当者を確認できません。ログインし直してください。
        </p>
      )}

      {sortingSources.length === 0 && (
        <p role="status" className="rounded-xl bg-kiwi-amber/25 px-4 py-3 text-sm text-kiwi-ink">
          追熟へ使用できる選果データがありません。先に選果を登録してください。
        </p>
      )}

      {state && !state.ok && "formError" in state && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.formError}
        </p>
      )}

      <Field label="担当者" htmlFor="staff-name" error={fieldErrors?.staffName?.[0]}>
        <Input
          id="staff-name"
          name="staffName"
          value={staffName}
          onValueChange={setStaffName}
          maxLength={80}
          required
          aria-invalid={Boolean(fieldErrors?.staffName)}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-[1fr_0.82fr] gap-3">
        <Field label="開始日" htmlFor="start-date" error={fieldErrors?.startDate?.[0]}>
          <Input
            id="start-date"
            name="startDate"
            type="date"
            value={startDate}
            onValueChange={handleStartDateChange}
            required
            className={inputClass}
          />
        </Field>
        <Field label="開始時刻" htmlFor="start-time" error={fieldErrors?.startTime?.[0]}>
          <Input
            id="start-time"
            name="startTime"
            type="time"
            value={startTime}
            onValueChange={setStartTime}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="追熟場所" htmlFor="ripening-location" error={fieldErrors?.locationId?.[0]}>
        <NativeSelect
          id="ripening-location"
          value={locationChoice}
          onChange={(event) => setLocationChoice(event.target.value)}
          required
          aria-invalid={Boolean(fieldErrors?.locationId)}
        >
          <option value="" disabled>追熟場所を選択</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>{location.name}</option>
          ))}
          <option value={NEW_LOCATION}>＋ 新しい場所を入力</option>
        </NativeSelect>
        <input
          type="hidden"
          name="locationId"
          value={locationChoice === NEW_LOCATION ? "" : locationChoice}
        />
      </Field>

      {locationChoice === NEW_LOCATION && (
        <Field label="新しい場所名" htmlFor="new-location" error={fieldErrors?.newLocationName?.[0]}>
          <Input
            id="new-location"
            name="newLocationName"
            value={newLocationName}
            onValueChange={setNewLocationName}
            placeholder="例：追熟庫A"
            maxLength={80}
            required
            className={inputClass}
          />
        </Field>
      )}
      {locationChoice !== NEW_LOCATION && <input type="hidden" name="newLocationName" value="" />}

      <fieldset className="space-y-3 rounded-2xl border border-kiwi-pale bg-white/80 p-4 shadow-sm">
        <legend className="sr-only">選果の内訳</legend>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-kiwi-ink">選果の内訳</h3>
          <span
            aria-live="polite"
            className="text-xs font-bold tabular-nums text-primary"
          >
            合計 {formatWeight(totalWeightKg)} kg
          </span>
        </div>

        {allocations.map((allocation, index) => {
          const selectedSource = sortingSources.find(
            (source) => source.id === allocation.sortingLogId,
          );
          const allocationError = allocationErrors[allocation.key];
          const allocationErrorId = `allocation-${allocation.key}-error`;

          return (
            <div key={allocation.key} className="space-y-2 rounded-xl bg-kiwi-cream/75 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-kiwi-brown">内訳 {index + 1}</span>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeAllocation(index)}
                    aria-label={`内訳${index + 1}を削除`}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground active:bg-black/5"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <NativeSelect
                name="sortingLogId"
                value={allocation.sortingLogId}
                onChange={(event) => handleSourceChange(index, event.target.value)}
                required
                aria-label={`内訳${index + 1}の選果データ`}
              >
                <option value="" disabled>選果データを選択</option>
                {sourcesForAllocation(index).map((source) => (
                  <option key={source.id} value={source.id}>{sourceLabel(source)}</option>
                ))}
              </NativeSelect>
              <div className="relative">
                <Input
                  name="itemWeightKg"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={allocation.weightKg}
                  onValueChange={(value) => handleWeightChange(index, value)}
                  placeholder="量"
                  required
                  max={selectedSource?.availableWeightKg}
                  aria-invalid={Boolean(allocationError)}
                  aria-describedby={allocationError ? allocationErrorId : undefined}
                  aria-label={`内訳${index + 1}の量`}
                  className={`${inputClass} pr-12 ${allocationError ? "border-destructive" : ""}`}
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
              </div>
              {allocationError && (
                <p
                  id={allocationErrorId}
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {allocationError}
                </p>
              )}
            </div>
          );
        })}

        {fieldErrors?.items?.[0] && (
          <p role="alert" className="text-sm text-destructive">
            {fieldErrors.items[0]}
          </p>
        )}

        {canAddAllocation && (
          <Button
            type="button"
            variant="outline"
            onClick={addAllocation}
            className="h-10 w-full rounded-xl border-dashed font-bold text-kiwi-ink"
          >
            <Plus className="size-4" />
            同じ品種の内訳を追加
          </Button>
        )}
      </fieldset>

      {/* 条件は最初から全項目を表示し、「戻す」で品種・月の初期値へ復元する。 */}
      <section className="rounded-2xl border border-primary/20 bg-white/80 shadow-sm">
        <div className="px-4 py-3.5">
          <span className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-bold text-kiwi-ink">追熟条件</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!firstSource || selectedDefaults.sourceType === "none"}
              onClick={() => firstSource && applyDefaults(firstSource.id, startDate)}
              className="h-8 shrink-0 rounded-lg bg-white/75 px-2.5 text-xs font-bold"
            >
              <RotateCcw className="size-3.5" />
              戻す
            </Button>
          </span>
        </div>

        <div className="space-y-3 border-t px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
        <Field label="エチレン温度" htmlFor="ethylene-temperature" optional={!saveAsStandard} error={fieldErrors?.ethyleneTemperatureC?.[0]}>
          <div className="relative">
            <Input
              id="ethylene-temperature"
              name="ethyleneTemperatureC"
              type="number"
              step="0.1"
              value={ethyleneTemperatureC}
              onValueChange={setEthyleneTemperatureC}
              required={saveAsStandard}
              className={`${inputClass} pr-10`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">℃</span>
          </div>
        </Field>
        <Field label="エチレン時間" htmlFor="ethylene-hours" error={fieldErrors?.ethyleneProcessingHours?.[0]}>
          <div className="relative">
            <Input
              id="ethylene-hours"
              name="ethyleneProcessingHours"
              type="number"
              min="0.01"
              step="0.5"
              value={ethyleneProcessingHours}
              onValueChange={setEthyleneProcessingHours}
              required
              className={`${inputClass} pr-12`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">時間</span>
          </div>
        </Field>
        <Field label="保管温度" htmlFor="resting-temperature" optional={!saveAsStandard} error={fieldErrors?.restingTemperatureC?.[0]}>
          <div className="relative">
            <Input
              id="resting-temperature"
              name="restingTemperatureC"
              type="number"
              step="0.1"
              value={restingTemperatureC}
              onValueChange={setRestingTemperatureC}
              required={saveAsStandard}
              className={`${inputClass} pr-10`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">℃</span>
          </div>
        </Field>
        <Field label="保管時間" htmlFor="resting-hours" error={fieldErrors?.restingDurationHours?.[0]}>
          <div className="relative">
            <Input
              id="resting-hours"
              name="restingDurationHours"
              type="number"
              min="0"
              step="0.5"
              value={restingDurationHours}
              onValueChange={setRestingDurationHours}
              required
              className={`${inputClass} pr-12`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">時間</span>
          </div>
        </Field>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-kiwi-ink">
            <input
              type="checkbox"
              name="saveAsStandard"
              checked={saveAsStandard}
              onChange={(event) => setSaveAsStandard(event.target.checked)}
              className="size-3.5 rounded border-input accent-primary"
            />
            <span>今回の条件を保存</span>
          </label>
        </div>
      </section>

      <details
        open={isMetaOpen}
        onToggle={(event) => setIsMetaOpen(event.currentTarget.open)}
        className="group rounded-2xl border border-input bg-white/70 shadow-sm"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
          <span>
            <span className="block text-sm font-bold text-kiwi-ink">通知・メモ</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              通知 {notificationsEnabled ? "ON" : "OFF"}{notes.trim() ? "・メモあり" : ""}
            </span>
          </span>
          <span className="rounded-full border bg-white px-2.5 py-1 text-xs font-bold text-kiwi-ink">
            設定
          </span>
        </summary>
        <div className="space-y-4 border-t px-4 py-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-white/80 px-4 py-3">
            <input
              type="checkbox"
              name="notificationsEnabled"
              checked={notificationsEnabled}
              onChange={(event) => setNotificationsEnabled(event.target.checked)}
              className="size-5 rounded border-input accent-primary"
            />
            <span>
              <span className="block text-sm font-bold text-kiwi-ink">確認時刻を通知対象にする</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">エチレン終了と出荷可能時刻を管理します</span>
            </span>
          </label>

          <Field label="メモ" htmlFor="ripening-notes" optional error={fieldErrors?.notes?.[0]}>
            <textarea
              id="ripening-notes"
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              placeholder="申し送りなどを入力"
              className={textareaClass}
            />
          </Field>
        </div>
      </details>

      <Button
        type="submit"
        disabled={!currentStaff || !staffName.trim() || sortingSources.length === 0 || isPending}
        className="mt-3 h-13 w-full rounded-full text-[15px] font-bold shadow-[0_8px_20px_-6px_rgba(66,160,71,0.5)]"
      >
        {isPending ? "登録中…" : "追熟を開始する"}
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent showCloseButton={false} className="gap-5 rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-kiwi-ink">
              追熟を開始して良いですか？
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <DialogClose render={<Button type="button" variant="outline" className="h-11 rounded-xl font-bold" />}>
              戻る
            </DialogClose>
            <Button type="button" onClick={confirmSubmission} className="h-11 rounded-xl font-bold">
              開始
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent showCloseButton={false} className="gap-5 rounded-3xl p-6 sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-1 grid size-14 place-items-center rounded-full bg-primary/12 text-2xl text-primary">
              ✓
            </div>
            <DialogTitle className="text-xl font-bold text-kiwi-ink">
              追熟を登録しました
            </DialogTitle>
            <DialogDescription>
              {state?.ok ? state.title : "追熟記録"}の次の操作を選んでください。
            </DialogDescription>
          </DialogHeader>

          {state?.ok && (
            <div className="rounded-2xl bg-muted/45 px-4 py-3 text-sm text-kiwi-ink">
              <p>エチレン終了：{formatDateTime(new Date(state.ethyleneEndedAt))}</p>
              <p className="mt-1 font-bold">出荷可能：{formatDateTime(new Date(state.shippableAt))}</p>
              {state.standardSaveWarning && (
                <p className="mt-2 text-destructive">
                  {state.standardSaveWarning}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCompleteOpen(false);
                requestAnimationFrame(() => document.getElementById("start-date")?.focus());
              }}
              className="h-12 rounded-xl bg-white font-bold"
            >
              <RotateCcw className="size-4" />
              続けて入力
            </Button>
            {state?.ok && (
              <Button
                render={<Link href={`/ripening/${state.id}/label`} target="_blank" />}
                onClick={() => setIsCompleteOpen(false)}
                className="h-12 rounded-xl font-bold"
              >
                <Printer className="size-4" />
                印刷
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
