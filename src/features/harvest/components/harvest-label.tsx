import styles from "@/features/harvest/components/harvest-label.module.css";
import {
  formatHarvestLabelDate,
  formatHarvestLabelTime,
  formatHarvestLabelWeight,
  harvestLabelBreakdownLines,
} from "@/features/harvest/label-format";
import type { HarvestLabelData } from "@/features/harvest/schema";

function Row({
  label,
  children,
  strong = false,
}: {
  label: string;
  children?: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.heading}>{label}</div>
      <div className={`${styles.value} ${strong ? styles.strong : ""}`}>
        {children}
      </div>
    </div>
  );
}

export function HarvestLabel({ data }: { data: HarvestLabelData }) {
  const breakdown = harvestLabelBreakdownLines(data);

  return (
    <article className={styles.label} aria-label={`${data.title}の収穫ラベル`}>
      <div className={styles.table}>
        <Row label="収穫ID" />
        <Row label="作業日">{formatHarvestLabelDate(data.workDate)}</Row>
        <Row label="作業時間">{formatHarvestLabelTime(data.workTime)}</Row>
        <Row label="担当者">{data.staffName}</Row>
        <Row label="園地">{data.plotName}</Row>
        <Row label="樹体">{data.treeBlockName ?? ""}</Row>
        <Row label="品種">{data.varietyName}</Row>
        <Row label="枝">{data.branch ?? ""}</Row>
        <Row label="量" strong>
          {formatHarvestLabelWeight(data.weightKg)} kg
        </Row>
        <Row label="選果期限">{formatHarvestLabelDate(data.sortingDeadline)}</Row>
        <div className={styles.row}>
          <div className={styles.heading}>内訳</div>
          <div className={styles.breakdownValue}>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={styles.breakdownLine}>
                {breakdown[index] ?? ""}
              </div>
            ))}
          </div>
        </div>
        <Row label="コードNo." />
      </div>
    </article>
  );
}
