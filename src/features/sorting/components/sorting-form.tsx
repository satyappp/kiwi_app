"use client";

import { Printer, RotateCcw } from "lucide-react";
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
  createSorting,
  type CreateSortingResult,
} from "@/features/sorting/actions";
import {
  getSortingOverageKg,
  sortingInputSchema,
  type SortingFormOptions,
  type StaffOption,
} from "@/features/sorting/schema";

type SortingFormProps = {
  currentStaff: StaffOption | null;
  options: SortingFormOptions;
  defaultSortingDate: string;
  returnTo?: "/dashboard";
};

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-3.5 text-[15px] shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";
const labelClass = "text-[13px] font-bold text-kiwi-ink";
const initialState: CreateSortingResult | null = null;
const defaultWeightKg = "1.00";

/** Shared label/error shell kept visually aligned with the harvest form. */
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

/** One label/value pair in the pre-submit confirmation dialog. */
function ConfirmationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-border/70 py-2.5 last:border-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words text-kiwi-ink">{value}</dd>
    </div>
  );
}

/**
 * Client form for fast, repeated size-by-size sorting entry.
 *
 * Server-provided harvest/master data stays in props. Only interactive form
 * selections live in local state, while submission and authoritative
 * validation run through createSorting via useActionState.
 */
export function SortingForm({
  currentStaff,
  options,
  defaultSortingDate,
  returnTo,
}: SortingFormProps) {
  const { harvests, sizeStandards } = options;
  const formRef = useRef<HTMLFormElement>(null);
  const isSubmissionConfirmed = useRef(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [sortingDate, setSortingDate] = useState(defaultSortingDate);
  const [harvestLogId, setHarvestLogId] = useState("");
  const [sizeStandardId, setSizeStandardId] = useState("");
  const [weightKg, setWeightKg] = useState(defaultWeightKg);

  async function submitSorting(
    previousState: CreateSortingResult | null,
    formData: FormData,
  ) {
    const result = await createSorting(previousState, formData);
    if (result.ok) {
      // Keep the source harvest selected for the next size entry.
      setSizeStandardId("");
      setWeightKg(defaultWeightKg);
      setIsCompleteOpen(true);
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
  const selectedSizeStandard = sizeStandards.find(
    (size) => size.id === sizeStandardId,
  );

  // Give immediate feedback; the server repeats this check against fresh data.
  const enteredWeightKg = Number(weightKg);
  const overageKg =
    selectedHarvest && weightKg && Number.isFinite(enteredWeightKg)
      ? getSortingOverageKg(enteredWeightKg, selectedHarvest.remainingWeightKg)
      : 0;
  const fieldErrors =
    state && !state.ok && "fieldErrors" in state
      ? state.fieldErrors
      : undefined;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (isSubmissionConfirmed.current) {
      isSubmissionConfirmed.current = false;
      return;
    }

    // Invalid entries go directly to the action so the existing field errors
    // are returned. Valid entries pause here for the worker's final review.
    const parsed = sortingInputSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
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
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
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

      <Field
        label="選果日"
        htmlFor="sorting-date"
        error={sortingDate ? undefined : fieldErrors?.sortingDate?.[0]}
      >
        <Input
          id="sorting-date"
          name="sortingDate"
          type="date"
          value={sortingDate}
          onChange={(event) => setSortingDate(event.target.value)}
          required
          aria-invalid={Boolean(fieldErrors?.sortingDate)}
          className={inputClass}
        />
      </Field>

      <Field
        label="元の収穫"
        htmlFor="harvest-log"
        error={harvestLogId ? undefined : fieldErrors?.harvestLogId?.[0]}
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

      {/* Inherited harvest fields are shown for confirmation, never re-entered. */}
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
        error={sizeStandardId ? undefined : fieldErrors?.sizeStandardId?.[0]}
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
          min="1"
          step="0.1"
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

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-4 rounded-2xl p-5"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-kiwi-ink">
              これで登録しますか？
            </DialogTitle>
            <DialogDescription>
              入力内容をご確認ください。
            </DialogDescription>
          </DialogHeader>

          <dl className="rounded-xl border border-border bg-muted/30 px-3">
            <ConfirmationRow
              label="担当者"
              value={currentStaff?.name ?? "確認できません"}
            />
            <ConfirmationRow
              label="選果日"
              value={sortingDate ? formatDate(sortingDate) : "未入力"}
            />
            <ConfirmationRow
              label="元の収穫"
              value={
                selectedHarvest
                  ? `${formatDate(selectedHarvest.workDate)}・${selectedHarvest.varietyName}・${selectedHarvest.plotName}${selectedHarvest.treeBlockName ? `・${selectedHarvest.treeBlockName}` : ""}`
                  : "未選択"
              }
            />
            <ConfirmationRow
              label="サイズ"
              value={selectedSizeStandard?.name ?? "未選択"}
            />
            <ConfirmationRow
              label="選果量"
              value={
                Number.isFinite(enteredWeightKg)
                  ? `${formatWeight(enteredWeightKg)} kg`
                  : "未入力"
              }
            />
          </dl>

          <div className="grid grid-cols-2 gap-3">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl font-bold"
                />
              }
            >
              戻る
            </DialogClose>
            <Button
              type="button"
              onClick={confirmSubmission}
              className="h-11 rounded-xl font-bold"
            >
              登録
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent showCloseButton={false} className="gap-5 rounded-3xl p-6 sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-1 grid size-14 place-items-center rounded-full bg-primary/12 text-2xl text-primary">✓</div>
            <DialogTitle className="text-xl font-bold text-kiwi-ink">選果を登録しました</DialogTitle>
            <DialogDescription>次の操作を選んでください。</DialogDescription>
          </DialogHeader>
          {state?.ok && state.warning && (
            <p className="rounded-xl bg-kiwi-amber/25 px-4 py-3 text-sm text-kiwi-brown">{state.warning}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCompleteOpen(false);
                requestAnimationFrame(() => document.getElementById("size-standard")?.focus());
              }}
              className="h-12 rounded-xl bg-white font-bold"
            >
              <RotateCcw className="size-4" />
              続けて入力
            </Button>
            {state?.ok && (
              <Button
                render={<Link href={`/sorting/${state.id}/label`} target="_blank" />}
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
