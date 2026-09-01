"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
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
};

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-3.5 text-[15px] shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

const textareaClass =
  "min-h-24 w-full resize-y rounded-xl border border-input bg-card px-3.5 py-2.5 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

const labelClass = "text-[13px] font-bold text-kiwi-ink";

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
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
    </div>
  );
}

export function HarvestForm({
  currentStaff,
  options,
  defaultDate,
  defaultTime,
}: HarvestFormProps) {
  const { plots, treeBlocks, varieties, staff } = options;
  const [workDate, setWorkDate] = useState(defaultDate);
  const [workTime, setWorkTime] = useState(defaultTime);
  const [plotId, setPlotId] = useState("");
  const [treeBlockId, setTreeBlockId] = useState("");
  const treeBlocksForPlot = treeBlocks.filter((tb) => tb.plotId === plotId);

  function handlePlotChange(nextPlotId: string) {
    setPlotId(nextPlotId);
    setTreeBlockId("");
  }

  return (
    <form className="space-y-4">
      {/* {!currentStaff && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          担当者を特定できませんでした。ログイン状態を確認してください。
        </p>
      )} */}

      <Field label="担当者" htmlFor="staff">
        <NativeSelect
          id="staff"
          name="staffId"
          defaultValue={currentStaff?.id ?? ""}
          required
        >
          <option value="" disabled>
            担当者を選択
          </option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="作業日" htmlFor="work-date">
        <Input
          id="work-date"
          name="workDate"
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field label="作業時間" htmlFor="work-time" optional>
        <Input
          id="work-time"
          name="workTime"
          type="time"
          value={workTime}
          onChange={(e) => setWorkTime(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="番地" htmlFor="plot">
        <NativeSelect
          id="plot"
          name="plotId"
          value={plotId}
          onChange={(e) => handlePlotChange(e.target.value)}
          required
        >
          <option value="" disabled>
            番地を選択
          </option>
          {plots.map((plot) => (
            <option key={plot.id} value={plot.id}>
              {plot.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="樹体" htmlFor="tree-block">
        <NativeSelect
          id="tree-block"
          name="treeBlockId"
          value={treeBlockId}
          onChange={(e) => setTreeBlockId(e.target.value)}
          required
          disabled={!plotId}
        >
          <option value="" disabled>
            {plotId ? "樹体を選択" : "先に番地を選択"}
          </option>
          {treeBlocksForPlot.map((tb) => (
            <option key={tb.id} value={tb.id}>
              {tb.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="品種" htmlFor="variety">
        <NativeSelect id="variety" name="varietyId" defaultValue="" required>
          <option value="" disabled>
            品種を選択
          </option>
          {varieties.map((variety) => (
            <option key={variety.id} value={variety.id}>
              {variety.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="枝" htmlFor="branch">
        <NativeSelect id="branch" name="branch" defaultValue="" required>
          <option value="" disabled>
            枝を選択
          </option>
          {BRANCH_OPTIONS.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="収穫量（kg）" htmlFor="weight">
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

      <Field label="選果期限" htmlFor="sorting-deadline">
        <Input
          id="sorting-deadline"
          name="sortingDeadline"
          type="date"
          required
          className={inputClass}
        />
      </Field>

      <Field label="メモ" htmlFor="notes" optional>
        <textarea
          id="notes"
          name="notes"
          placeholder="メモを入力"
          className={textareaClass}
        />
      </Field>

      <Button
        type="submit"
        disabled={!currentStaff}
        className="mt-3 h-13 w-full rounded-full text-[15px] font-bold shadow-[0_8px_20px_-6px_rgba(66,160,71,0.5)]"
      >
        登録する
      </Button>
    </form>
  );
}
