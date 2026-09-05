"use client";

import { Plus, Trash2 } from "lucide-react";
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
  type RipeningFormOptions,
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

function ConfirmationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-border/70 py-2.5 last:border-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words text-kiwi-ink">{value}</dd>
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

function calculateTimeline(
  startDate: string,
  startTime: string,
  ethyleneHours: string,
  restingHours: string,
) {
  const start = new Date(`${startDate}T${startTime}:00+09:00`);
  const ethylene = Number(ethyleneHours);
  const resting = Number(restingHours);
  if (
    Number.isNaN(start.getTime()) ||
    !Number.isFinite(ethylene) ||
    ethylene <= 0 ||
    !Number.isFinite(resting) ||
    resting < 0
  ) {
    return null;
  }

  const ethyleneEnd = new Date(start.getTime() + ethylene * 60 * 60 * 1000);
  const shippable = new Date(ethyleneEnd.getTime() + resting * 60 * 60 * 1000);
  return { start, ethyleneEnd, shippable };
}

function sourceLabel(source: SortingRipeningOption) {
  return `${formatDate(source.sortingDate)}・${source.title}（残 ${formatWeight(source.availableWeightKg)} kg）`;
}

export function RipeningForm({
  currentStaff,
  options,
  defaultDate,
  defaultTime,
}: RipeningFormProps) {
  const { locations, rules, sortingSources } = options;
  const formRef = useRef<HTMLFormElement>(null);
  const nextAllocationKey = useRef(2);
  const isSubmissionConfirmed = useRef(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultTime);
  const [locationChoice, setLocationChoice] = useState(
    locations.length === 0 ? NEW_LOCATION : "",
  );
  const [newLocationName, setNewLocationName] = useState("");
  const [allocations, setAllocations] = useState<AllocationDraft[]>([
    { key: 1, sortingLogId: "", weightKg: "" },
  ]);
  const [ethyleneTemperatureC, setEthyleneTemperatureC] = useState("");
  const [ethyleneProcessingHours, setEthyleneProcessingHours] = useState("");
  const [restingTemperatureC, setRestingTemperatureC] = useState("");
  const [restingDurationHours, setRestingDurationHours] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notes, setNotes] = useState("");

  async function submitRipening(
    previousState: StartRipeningResult | null,
    formData: FormData,
  ) {
    const result = await startRipening(previousState, formData);
    if (result.ok) {
      formRef.current?.reset();
      setAllocations([
        {
          key: nextAllocationKey.current++,
          sortingLogId: "",
          weightKg: "",
        },
      ]);
      setEthyleneTemperatureC("");
      setEthyleneProcessingHours("");
      setRestingTemperatureC("");
      setRestingDurationHours("");
      setNotificationsEnabled(true);
      setNewLocationName("");
      setNotes("");
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
  const selectedRule = firstSource
    ? rules.find(
        (rule) =>
          rule.varietyId === firstSource.varietyId &&
          rule.startMonth === Number(startDate.slice(5, 7)),
      )
    : undefined;
  const selectedSourceIds = new Set(
    allocations.map((allocation) => allocation.sortingLogId).filter(Boolean),
  );
  const totalWeightKg = allocations.reduce((total, allocation) => {
    const value = Number(allocation.weightKg);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
  const timeline = calculateTimeline(
    startDate,
    startTime,
    ethyleneProcessingHours,
    restingDurationHours,
  );
  const canAddAllocation =
    firstSource &&
    sortingSources.some(
      (source) =>
        source.varietyId === firstSource.varietyId &&
        !selectedSourceIds.has(source.id),
    );

  function applyRule(sourceId: string, date: string) {
    const source = sortingSources.find((candidate) => candidate.id === sourceId);
    const rule = source
      ? rules.find(
          (candidate) =>
            candidate.varietyId === source.varietyId &&
            candidate.startMonth === Number(date.slice(5, 7)),
        )
      : undefined;

    setEthyleneTemperatureC(rule?.ethyleneTemperatureC?.toString() ?? "");
    setEthyleneProcessingHours(rule?.ethyleneDurationHours?.toString() ?? "");
    setRestingTemperatureC(rule?.restingTemperatureC?.toString() ?? "");
    setRestingDurationHours(rule?.restingDurationHours?.toString() ?? "");
  }

  function handleStartDateChange(nextDate: string) {
    setStartDate(nextDate);
    applyRule(allocations[0]?.sortingLogId ?? "", nextDate);
  }

  function handleSourceChange(index: number, sortingLogId: string) {
    const source = sortingSources.find((candidate) => candidate.id === sortingLogId);
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
    if (index === 0) applyRule(sortingLogId, startDate);
  }

  function handleWeightChange(index: number, weightKg: string) {
    setAllocations((current) =>
      current.map((allocation, allocationIndex) =>
        allocationIndex === index ? { ...allocation, weightKg } : allocation,
      ),
    );
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
    setAllocations((current) =>
      current.filter((_, allocationIndex) => allocationIndex !== index),
    );
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

    const parsed = ripeningInputSchema.safeParse({
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

      {state?.ok && (
        <div role="status" className="space-y-1 rounded-xl bg-primary/10 px-4 py-3 text-sm text-kiwi-ink">
          <p className="font-bold">{state.title}を登録しました。</p>
          <p>エチレン終了：{formatDateTime(new Date(state.ethyleneEndedAt))}</p>
          <p>出荷可能：{formatDateTime(new Date(state.shippableAt))}</p>
        </div>
      )}

      {state && !state.ok && "formError" in state && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.formError}
        </p>
      )}

      <Field label="担当者" htmlFor="staff-display">
        <div id="staff-display" className="flex h-12 items-center rounded-xl border border-input bg-muted/60 px-3.5 text-[15px] text-kiwi-ink shadow-sm">
          {currentStaff?.name ?? "確認できません"}
        </div>
      </Field>

      <div className="grid grid-cols-[1fr_0.82fr] gap-3">
        <Field label="開始日" htmlFor="start-date" error={fieldErrors?.startDate?.[0]}>
          <Input
            id="start-date"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(event) => handleStartDateChange(event.target.value)}
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
            onChange={(event) => setStartTime(event.target.value)}
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
            onChange={(event) => setNewLocationName(event.target.value)}
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
          <span className="text-xs font-bold tabular-nums text-primary">
            合計 {formatWeight(totalWeightKg)} kg
          </span>
        </div>

        {allocations.map((allocation, index) => {
          const selectedSource = sortingSources.find(
            (source) => source.id === allocation.sortingLogId,
          );
          const enteredWeight = Number(allocation.weightKg);
          const isOver =
            selectedSource &&
            Number.isFinite(enteredWeight) &&
            enteredWeight > selectedSource.availableWeightKg;

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
                  onChange={(event) => handleWeightChange(index, event.target.value)}
                  placeholder="量"
                  required
                  aria-label={`内訳${index + 1}の量`}
                  className={`${inputClass} pr-12 ${isOver ? "border-destructive" : ""}`}
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
              </div>
              {isOver && (
                <p className="text-xs text-destructive">
                  使用可能な{formatWeight(selectedSource.availableWeightKg)} kgを超えています。
                </p>
              )}
            </div>
          );
        })}

        {fieldErrors?.items?.[0] && <p className="text-sm text-destructive">{fieldErrors.items[0]}</p>}

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

      {firstSource && (
        <div className={`rounded-xl px-4 py-3 text-sm ${selectedRule?.isScheduleConfigured ? "bg-primary/10 text-kiwi-ink" : "bg-kiwi-amber/25 text-kiwi-brown"}`}>
          <p className="font-bold">
            {startDate.slice(5, 7).replace(/^0/, "")}月・{firstSource.varietyName}の標準条件
          </p>
          <p className="mt-0.5 text-xs leading-5">
            {selectedRule?.isScheduleConfigured
              ? "追熟マスタの値を入力欄へ反映しました。必要に応じて変更できます。"
              : "標準時間が未設定です。今回使用する条件を入力してください。"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="エチレン温度" htmlFor="ethylene-temperature" optional error={fieldErrors?.ethyleneTemperatureC?.[0]}>
          <div className="relative">
            <Input
              id="ethylene-temperature"
              name="ethyleneTemperatureC"
              type="number"
              step="0.1"
              value={ethyleneTemperatureC}
              onChange={(event) => setEthyleneTemperatureC(event.target.value)}
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
              onChange={(event) => setEthyleneProcessingHours(event.target.value)}
              required
              className={`${inputClass} pr-12`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">時間</span>
          </div>
        </Field>
        <Field label="寝かせ温度" htmlFor="resting-temperature" optional error={fieldErrors?.restingTemperatureC?.[0]}>
          <div className="relative">
            <Input
              id="resting-temperature"
              name="restingTemperatureC"
              type="number"
              step="0.1"
              value={restingTemperatureC}
              onChange={(event) => setRestingTemperatureC(event.target.value)}
              className={`${inputClass} pr-10`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">℃</span>
          </div>
        </Field>
        <Field label="寝かせ時間" htmlFor="resting-hours" error={fieldErrors?.restingDurationHours?.[0]}>
          <div className="relative">
            <Input
              id="resting-hours"
              name="restingDurationHours"
              type="number"
              min="0"
              step="0.5"
              value={restingDurationHours}
              onChange={(event) => setRestingDurationHours(event.target.value)}
              required
              className={`${inputClass} pr-12`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">時間</span>
          </div>
        </Field>
      </div>

      {timeline && (
        <section className="rounded-2xl bg-kiwi-ink p-4 text-white shadow-sm">
          <h3 className="text-xs font-bold tracking-[0.1em] text-white/65">予定タイムライン</h3>
          <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 text-sm">
            <span className="text-white/65">エチレン開始</span>
            <time className="text-right font-bold tabular-nums">{formatDateTime(timeline.start)}</time>
            <span className="text-white/65">エチレン終了</span>
            <time className="text-right font-bold tabular-nums text-kiwi-amber">{formatDateTime(timeline.ethyleneEnd)}</time>
            <span className="text-white/65">寝かせ開始</span>
            <time className="text-right font-bold tabular-nums">{formatDateTime(timeline.ethyleneEnd)}</time>
            <span className="text-white/65">出荷可能</span>
            <time className="text-right font-bold tabular-nums text-kiwi-pale">{formatDateTime(timeline.shippable)}</time>
          </div>
        </section>
      )}

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-white/80 px-4 py-3 shadow-sm">
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

      <Button
        type="submit"
        disabled={!currentStaff || sortingSources.length === 0 || isPending}
        className="mt-3 h-13 w-full rounded-full text-[15px] font-bold shadow-[0_8px_20px_-6px_rgba(66,160,71,0.5)]"
      >
        {isPending ? "登録中…" : "追熟を開始する"}
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent showCloseButton={false} className="max-h-[85dvh] gap-4 overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-kiwi-ink">この内容で追熟を開始しますか？</DialogTitle>
            <DialogDescription>終了予定と内訳をご確認ください。</DialogDescription>
          </DialogHeader>

          <dl className="rounded-xl border border-border bg-muted/30 px-3">
            <ConfirmationRow label="担当者" value={currentStaff?.name ?? "確認できません"} />
            <ConfirmationRow label="開始" value={`${formatDate(startDate)} ${startTime}`} />
            <ConfirmationRow
              label="追熟場所"
              value={
                locationChoice === NEW_LOCATION
                  ? newLocationName || "未入力"
                  : locations.find((location) => location.id === locationChoice)?.name ?? "未選択"
              }
            />
            <ConfirmationRow label="品種" value={firstSource?.varietyName ?? "未選択"} />
            <ConfirmationRow label="合計量" value={`${formatWeight(totalWeightKg)} kg`} />
            <ConfirmationRow label="内訳" value={allocations.map((allocation) => {
              const source = sortingSources.find((candidate) => candidate.id === allocation.sortingLogId);
              return `${source?.title ?? "未選択"} ${allocation.weightKg || "0"} kg`;
            }).join(" / ")} />
            <ConfirmationRow label="エチレン" value={`${ethyleneTemperatureC ? `${ethyleneTemperatureC}℃・` : ""}${ethyleneProcessingHours || "未入力"}時間`} />
            <ConfirmationRow label="寝かせ" value={`${restingTemperatureC ? `${restingTemperatureC}℃・` : ""}${restingDurationHours || "未入力"}時間`} />
            <ConfirmationRow label="終了予定" value={timeline ? formatDateTime(timeline.ethyleneEnd) : "算出できません"} />
            <ConfirmationRow label="出荷可能" value={timeline ? formatDateTime(timeline.shippable) : "算出できません"} />
            <ConfirmationRow label="通知" value={notificationsEnabled ? "通知対象にする" : "通知対象にしない"} />
            <ConfirmationRow label="メモ" value={notes.trim() || "なし"} />
          </dl>

          <div className="grid grid-cols-2 gap-3">
            <DialogClose render={<Button type="button" variant="outline" className="h-11 rounded-xl font-bold" />}>
              戻る
            </DialogClose>
            <Button type="button" onClick={confirmSubmission} className="h-11 rounded-xl font-bold">
              開始する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
