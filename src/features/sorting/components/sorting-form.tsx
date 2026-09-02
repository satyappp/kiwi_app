"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  createSorting,
  type CreateSortingResult,
} from "@/features/sorting/actions";
import {
  getSortingOverageKg,
  type SortingFormOptions,
  type StaffOption,
} from "@/features/sorting/schema";

type SortingFormProps = {
  currentStaff: StaffOption | null;
  options: SortingFormOptions;
  currentDate: string;
};

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-3.5 text-[15px] shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";
const labelClass = "text-[13px] font-bold text-kiwi-ink";
const initialState: CreateSortingResult | null = null;

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className={labelClass}>
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function formatDate(date: string) {
  return date.replaceAll("-", "/");
}

function formatWeight(weightKg: number) {
  return weightKg.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function SortingForm({
  currentStaff,
  options,
  currentDate,
}: SortingFormProps) {
  const { harvests, sizeStandards } = options;
  const [harvestLogId, setHarvestLogId] = useState("");
  const [sizeStandardId, setSizeStandardId] = useState("");
  const [weightKg, setWeightKg] = useState("");

  async function submitSorting(
    previousState: CreateSortingResult | null,
    formData: FormData,
  ) {
    const result = await createSorting(previousState, formData);
    if (result.ok) {
      setSizeStandardId("");
      setWeightKg("");
    }
    return result;
  }

  const [state, formAction, isPending] = useActionState(
    submitSorting,
    initialState,
  );

  const selectedHarvest = harvests.find(
    (harvest) => harvest.id === harvestLogId,
  );
  const enteredWeightKg = Number(weightKg);
  const overageKg =
    selectedHarvest && weightKg && Number.isFinite(enteredWeightKg)
      ? getSortingOverageKg(enteredWeightKg, selectedHarvest.remainingWeightKg)
      : 0;
  const fieldErrors =
    state && !state.ok && "fieldErrors" in state
      ? state.fieldErrors
      : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {!currentStaff && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          担当者を確認できません。ログインし直してください。
        </p>
      )}

      {harvests.length === 0 && (
        <p
          role="status"
          className="rounded-xl bg-kiwi-amber/25 px-4 py-3 text-sm text-kiwi-ink"
        >
          選択できる収穫データがありません。先に収穫を登録してください。
        </p>
      )}

      {state?.ok && (
        <div
          role="status"
          className="space-y-1 rounded-xl bg-primary/10 px-4 py-3 text-sm text-kiwi-ink"
        >
          <p className="font-medium">選果を登録しました。</p>
          {state.warning && <p className="text-kiwi-brown">{state.warning}</p>}
        </div>
      )}

      {state && !state.ok && "formError" in state && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.formError}
        </p>
      )}

      <Field label="担当者" htmlFor="staff-display">
        <div
          id="staff-display"
          className="flex h-12 items-center rounded-xl border border-input bg-muted/60 px-3.5 text-[15px] text-kiwi-ink shadow-sm"
        >
          {currentStaff?.name ?? "確認できません"}
        </div>
      </Field>

      <Field label="選果日" htmlFor="sorting-date-display">
        <div
          id="sorting-date-display"
          className="flex h-12 items-center rounded-xl border border-input bg-muted/60 px-3.5 text-[15px] text-kiwi-ink shadow-sm"
        >
          {formatDate(currentDate)}
        </div>
      </Field>

      <Field
        label="元の収穫"
        htmlFor="harvest-log"
        error={fieldErrors?.harvestLogId?.[0]}
      >
        <NativeSelect
          id="harvest-log"
          name="harvestLogId"
          value={harvestLogId}
          onChange={(event) => setHarvestLogId(event.target.value)}
          disabled={harvests.length === 0}
          required
          aria-invalid={Boolean(fieldErrors?.harvestLogId)}
        >
          <option value="" disabled>
            収穫データを選択
          </option>
          {harvests.map((harvest) => (
            <option key={harvest.id} value={harvest.id}>
              {formatDate(harvest.workDate)}・{harvest.varietyName}・
              {harvest.plotName}
              {harvest.treeBlockName ? `・${harvest.treeBlockName}` : ""}
              {`（残 ${formatWeight(harvest.remainingWeightKg)} kg）`}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {selectedHarvest && (
        <section className="rounded-2xl border border-kiwi-pale bg-white/85 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-kiwi-ink">収穫情報</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">品種</dt>
              <dd className="mt-0.5 font-medium text-kiwi-ink">
                {selectedHarvest.varietyName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">番地・樹体</dt>
              <dd className="mt-0.5 font-medium text-kiwi-ink">
                {selectedHarvest.plotName}
                {selectedHarvest.treeBlockName
                  ? `・${selectedHarvest.treeBlockName}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">選果期限</dt>
              <dd className="mt-0.5 font-medium text-kiwi-ink">
                {formatDate(selectedHarvest.sortingDeadline)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">収穫量</dt>
              <dd className="mt-0.5 font-medium text-kiwi-ink">
                {formatWeight(selectedHarvest.harvestedWeightKg)} kg
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">選果済み</dt>
              <dd className="mt-0.5 font-medium text-kiwi-ink">
                {formatWeight(selectedHarvest.sortedWeightKg)} kg
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">未選果残量</dt>
              <dd
                className={`mt-0.5 font-bold ${
                  selectedHarvest.remainingWeightKg < 0
                    ? "text-destructive"
                    : "text-primary"
                }`}
              >
                {formatWeight(selectedHarvest.remainingWeightKg)} kg
              </dd>
            </div>
          </dl>
        </section>
      )}

      <Field
        label="サイズ"
        htmlFor="size-standard"
        error={fieldErrors?.sizeStandardId?.[0]}
      >
        <NativeSelect
          id="size-standard"
          name="sizeStandardId"
          value={sizeStandardId}
          onChange={(event) => setSizeStandardId(event.target.value)}
          required
          aria-invalid={Boolean(fieldErrors?.sizeStandardId)}
        >
          <option value="" disabled>
            サイズを選択
          </option>
          {sizeStandards.map((size) => (
            <option key={size.id} value={size.id}>
              {size.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field
        label="選果量（kg）"
        htmlFor="weight"
        error={fieldErrors?.weightKg?.[0]}
      >
        <Input
          id="weight"
          name="weightKg"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={weightKg}
          onChange={(event) => setWeightKg(event.target.value)}
          required
          aria-invalid={Boolean(fieldErrors?.weightKg)}
          className={inputClass}
        />
      </Field>

      {overageKg > 0 && (
        <p
          role="alert"
          className="rounded-xl bg-kiwi-amber/30 px-4 py-3 text-sm text-kiwi-brown"
        >
          未選果残量を{formatWeight(overageKg)} kg超えます。数量を確認してください。
        </p>
      )}

      <Button
        type="submit"
        disabled={
          !currentStaff ||
          harvests.length === 0 ||
          sizeStandards.length === 0 ||
          isPending
        }
        className="mt-3 h-13 w-full rounded-full text-[15px] font-bold shadow-[0_8px_20px_-6px_rgba(66,160,71,0.5)]"
      >
        {isPending ? "登録中…" : "登録する"}
      </Button>
    </form>
  );
}
