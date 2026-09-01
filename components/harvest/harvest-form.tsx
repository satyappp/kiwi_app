"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = {
  id: string;
  name: string;
};

type CurrentUser = Option | null;

type HarvestFormProps = {
  currentUser: CurrentUser;
  plots: Option[];
  varieties: Option[];
  workers: Option[];
};

export function HarvestForm({
  currentUser,
  plots,
  varieties,
  workers,
}: HarvestFormProps) {
  return (
    <form className="space-y-5">
      {!currentUser && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          担当者を特定できませんでした。ログイン状態を確認してください。
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="harvest-date">収穫日</Label>
        <Input id="harvest-date" name="harvestDate" type="date" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="harvest-time">収穫時刻</Label>
        <Input id="harvest-time" name="harvestTime" type="time" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plot">区画</Label>
        <select
          id="plot"
          name="plotId"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          defaultValue=""
          required
        >
          <option value="" disabled>
            区画を選択
          </option>
          {plots.map((plot) => (
            <option key={plot.id} value={plot.id}>
              {plot.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="variety">品種</Label>
        <select
          id="variety"
          name="varietyId"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          defaultValue=""
          required
        >
          <option value="" disabled>
            品種を選択
          </option>
          {varieties.map((variety) => (
            <option key={variety.id} value={variety.id}>
              {variety.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="worker">担当者</Label>
        <select
          id="worker"
          name="workerId"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          defaultValue=""
          required
        >
          <option value="" disabled>
            担当者を選択
          </option>
          {workers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weight">収穫量（kg）</Label>
        <Input
          id="weight"
          name="weightKg"
          type="number"
          min="0"
          step="0.1"
          inputMode="decimal"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">メモ</Label>
        <textarea
          id="notes"
          name="notes"
          className="min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="メモを入力（任意）"
        />
      </div>

      <Button className="w-full" type="submit" disabled={!currentUser}>
        登録する
      </Button>
    </form>
  );
}
