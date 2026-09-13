import styles from "@/features/sorting/components/sorting-label.module.css";
import {
  formatSortingLabelDate,
  formatSortingLabelWeight,
  sortingLabelBreakdownLines,
} from "@/features/sorting/label-format";
import type { SortingLabelData } from "@/features/sorting/schema";

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

export function SortingLabel({ data }: { data: SortingLabelData }) {
  const breakdown = sortingLabelBreakdownLines(data);

  return (
    <article className={styles.label} aria-label={`${data.varietyName}の選果ラベル`}>
      <div className={styles.table}>
        <Row label="選果ID" />
        <Row label="選果日">{formatSortingLabelDate(data.sortingDate)}</Row>
        <Row label="担当者">{data.staffName}</Row>
        <Row label="園地">{data.plotName}</Row>
        <Row label="品種">{data.varietyName}</Row>
        <Row label="等級">{data.sizeCode}（{data.sizeName}）</Row>
        <Row label="量" strong>{formatSortingLabelWeight(data.weightKg)} kg</Row>
        <Row label="元収穫">{data.harvestTitle}</Row>
        <Row label="エチレン期限">{formatSortingLabelDate(data.ethyleneStartDeadline)}</Row>
        <Row label="選果期限">{formatSortingLabelDate(data.sortingDeadline)}</Row>
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
