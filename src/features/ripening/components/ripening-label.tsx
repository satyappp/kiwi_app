import styles from "@/features/ripening/components/ripening-label.module.css";
import {
  blankRestingRange,
  formatLabelDateTime,
  formatLabelRange,
  formatLabelTemperature,
  formatLabelWeight,
  labelBreakdownLines,
} from "@/features/ripening/label-format";
import type { RipeningLabelData } from "@/features/ripening/schema";

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

export function RipeningLabel({ data }: { data: RipeningLabelData }) {
  const breakdown = labelBreakdownLines(data);

  return (
    <article className={styles.label} aria-label={`${data.title}の追熟ラベル`}>
      <div className={styles.table}>
        <Row label="追熟ID" />
        <Row label="園地">{data.plotNames.join("・") || "-"}</Row>
        <Row label="品種">{data.varietyName}</Row>
        <Row label="等級">{data.sizeCodes.join("・") || "-"}</Row>
        <Row label="量" strong>{formatLabelWeight(data.weightKg)} kg</Row>
        <Row label="寝かせ">{blankRestingRange}</Row>
        <Row label="エチレン">
          {formatLabelTemperature(data.ethyleneTemperatureC)}　
          {formatLabelRange(data.ethyleneStartedAt, data.ethyleneEndedAt)}
        </Row>
        <Row label="再寝かせ">
          {formatLabelTemperature(data.restingTemperatureC)}　
          {formatLabelRange(data.restingStartedAt, data.shippableAt)}
        </Row>
        <Row label="出荷予定">{formatLabelDateTime(data.shippableAt)} ～</Row>
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
