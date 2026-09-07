"use client";

import { Printer, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  createHarvest,
  type CreateHarvestResult,
} from "@/features/harvest/actions";
import {
  BRANCH_OPTIONS,
  type HarvestFormOptions,
  type Option,
} from "@/features/harvest/schema";

type HarvestFormProps = {
  currentStaff: Option | null;
  options: HarvestFormOptions;
  defaultDate: string;
  defaultTime: string;
  defaultSortingDeadline: string;
};

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-3.5 text-[15px] shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

const textareaClass =
  "min-h-24 w-full resize-y rounded-xl border border-input bg-card px-3.5 py-2.5 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

const labelClass = "text-[13px] font-bold text-kiwi-ink";
const initialState: CreateHarvestResult | null = null;

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

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function HarvestForm({
  currentStaff,
  options,
  defaultDate,
  defaultTime,
  defaultSortingDeadline,
}: HarvestFormProps) {
  const { plots, treeBlocks, varieties } = options;
  const formRef = useRef<HTMLFormElement>(null);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [workDate, setWorkDate] = useState(defaultDate);
  const [workTime, setWorkTime] = useState(defaultTime);
  const [sortingDeadline, setSortingDeadline] = useState(
    defaultSortingDeadline,
  );
  const [plotId, setPlotId] = useState("");
  const [treeBlockId, setTreeBlockId] = useState("");

  async function submitHarvest(
    previousState: CreateHarvestResult | null,
    formData: FormData,
  ) {
    const result = await createHarvest(previousState, formData);
    if (result.ok) {
      formRef.current?.reset();
      setPlotId("");
      setTreeBlockId("");
      setIsCompleteOpen(true);
    }
    return result;
  }
  const [state, formAction, isPending] = useActionState(
    submitHarvest,
    initialState,
  );
  const treeBlocksForPlot = treeBlocks.filter((tb) => tb.plotId === plotId);
  const fieldErrors =
    state && !state.ok && "fieldErrors" in state
      ? state.fieldErrors
      : undefined;

  function handleDateChange(nextDate: string) {
    setWorkDate(nextDate);
    if (nextDate) setSortingDeadline(addDays(nextDate, 30));
  }

  function handlePlotChange(nextPlotId: string) {
    setPlotId(nextPlotId);
    setTreeBlockId("");
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      {!currentStaff && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          担当者を確認できません。ログインし直してください。
        </p>
      )}

      {state && !state.ok && "formError" in state && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
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

      <Field label="作業日" htmlFor="work-date" error={fieldErrors?.workDate?.[0]}>
        <Input
          id="work-date"
          name="workDate"
          type="date"
          value={workDate}
          onChange={(event) => handleDateChange(event.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field label="作業時間" htmlFor="work-time" optional error={fieldErrors?.workTime?.[0]}>
        <Input
          id="work-time"
          name="workTime"
          type="time"
          value={workTime}
          onChange={(event) => setWorkTime(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="番地" htmlFor="plot" error={fieldErrors?.plotId?.[0]}>
        <NativeSelect
          id="plot"
          name="plotId"
          value={plotId}
          onChange={(event) => handlePlotChange(event.target.value)}
          required
        >
          <option value="" disabled>番地を選択</option>
          {plots.map((plot) => (
            <option key={plot.id} value={plot.id}>{plot.name}</option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="樹体" htmlFor="tree-block" optional error={fieldErrors?.treeBlockId?.[0]}>
        <NativeSelect
          id="tree-block"
          name="treeBlockId"
          value={treeBlockId}
          onChange={(event) => setTreeBlockId(event.target.value)}
          disabled={!plotId}
        >
          <option value="">
            {plotId ? "選択しない" : "先に番地を選択"}
          </option>
          {treeBlocksForPlot.map((treeBlock) => (
            <option key={treeBlock.id} value={treeBlock.id}>{treeBlock.name}</option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="品種" htmlFor="variety" error={fieldErrors?.varietyId?.[0]}>
        <NativeSelect id="variety" name="varietyId" defaultValue="" required>
          <option value="" disabled>品種を選択</option>
          {varieties.map((variety) => (
            <option key={variety.id} value={variety.id}>{variety.name}</option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="枝" htmlFor="branch" optional error={fieldErrors?.branch?.[0]}>
        <NativeSelect id="branch" name="branch" defaultValue="">
          <option value="">選択しない</option>
          {BRANCH_OPTIONS.map((branch) => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="収穫量（kg）" htmlFor="weight" error={fieldErrors?.weightKg?.[0]}>
        <Input
          id="weight"
          name="weightKg"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          required
          className={inputClass}
        />
      </Field>

      <Field label="選果期限" htmlFor="sorting-deadline" error={fieldErrors?.sortingDeadline?.[0]}>
        <Input
          id="sorting-deadline"
          name="sortingDeadline"
          type="date"
          value={sortingDeadline}
          onChange={(event) => setSortingDeadline(event.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field label="メモ" htmlFor="notes" optional error={fieldErrors?.notes?.[0]}>
        <textarea
          id="notes"
          name="notes"
          maxLength={500}
          placeholder="メモを入力"
          className={textareaClass}
        />
      </Field>

      <Button
        type="submit"
        disabled={!currentStaff || isPending}
        className="mt-3 h-13 w-full rounded-full text-[15px] font-bold shadow-[0_8px_20px_-6px_rgba(66,160,71,0.5)]"
      >
        {isPending ? "登録中…" : "登録する"}
      </Button>

      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent showCloseButton={false} className="gap-5 rounded-3xl p-6 sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-1 grid size-14 place-items-center rounded-full bg-primary/12 text-2xl text-primary">
              ✓
            </div>
            <DialogTitle className="text-xl font-bold text-kiwi-ink">
              収穫を登録しました
            </DialogTitle>
            <DialogDescription>
              {state?.ok ? state.title : "収穫記録"}の次の操作を選んでください。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCompleteOpen(false);
                requestAnimationFrame(() => document.getElementById("plot")?.focus());
              }}
              className="h-12 rounded-xl bg-white font-bold"
            >
              <RotateCcw className="size-4" />
              続けて入力
            </Button>
            {state?.ok && (
              <Button
                render={<Link href={`/harvest/${state.id}/label`} target="_blank" />}
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
