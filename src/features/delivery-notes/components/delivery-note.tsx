import { deliveryNoteIssuer } from "@/features/delivery-notes/config";
import {
  formatJapaneseDate,
  formatKg,
  formatYen,
} from "@/features/delivery-notes/format";
import type { DeliveryNoteDocument } from "@/features/delivery-notes/schema";

import styles from "./delivery-note.module.css";

const TABLE_ROWS = 9;

export function DeliveryNote({ data }: { data: DeliveryNoteDocument }) {
  return (
    <article className={styles.sheet} aria-label={`${data.recipientName}宛の納品書`}>
      <h1 className={styles.title}>納品書</h1>

      <div className={styles.top}>
        <section>
          <p className={styles.recipientName}>{data.recipientName} {data.recipientHonorific}</p>
          <p className={styles.recipientAddress}>
            {[data.recipientPostalCode, data.recipientAddress]
              .filter(Boolean)
              .join("\n")}
          </p>
          <p className={styles.message}>下記の通り納品いたします。</p>
        </section>

        <section>
          <dl className={styles.meta}>
            <dt>納品日</dt>
            <dd>{formatJapaneseDate(data.deliveryDate)}</dd>
            <dt>納品書番号</dt>
            <dd>{data.documentNumber}</dd>
            <dt>登録番号</dt>
            <dd>{deliveryNoteIssuer.registrationNumber}</dd>
          </dl>
          <div className={styles.issuer}>
            <p className={styles.issuerName}>{deliveryNoteIssuer.companyName}</p>
            <p>{deliveryNoteIssuer.postalCode}</p>
            <p>{deliveryNoteIssuer.address}</p>
            <p>電話：{deliveryNoteIssuer.phone}</p>
            <p>メール：{deliveryNoteIssuer.email}</p>
            <span className={styles.stamp} aria-label="社印欄">印</span>
          </div>
        </section>
      </div>

      <div className={styles.subject}>
        <span className={styles.subjectLabel}>件名</span>
        <span>{data.subject}</span>
      </div>

      <section className={styles.summary} aria-label="金額概要">
        {[
          ["小計", formatYen(data.subtotalYen)],
          ["消費税", formatYen(data.taxYen)],
          ["合計金額", formatYen(data.totalYen)],
        ].map(([label, value]) => (
          <div key={label} className={styles.summaryCell}>
            <div className={styles.summaryLabel}>{label}</div>
            <div className={styles.summaryValue}>{value}</div>
          </div>
        ))}
      </section>

      <table className={styles.items}>
        <thead>
          <tr>
            <th className={styles.descriptionColumn}>品名</th>
            <th className={styles.quantityColumn}>数量</th>
            <th className={styles.unitColumn}>単位</th>
            <th className={styles.priceColumn}>単価</th>
            <th className={styles.taxColumn}>税率</th>
            <th className={styles.amountColumn}>金額</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id}>
              <td>{item.description}</td>
              <td className={styles.number}>{formatKg(item.quantity)}</td>
              <td>{item.unit}</td>
              <td className={styles.number}>{formatYen(item.unitPriceYen)}</td>
              <td className={styles.number}>{item.taxRate * 100}%</td>
              <td className={styles.number}>{formatYen(item.subtotalYen)}</td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, TABLE_ROWS - data.items.length) }, (_, index) => (
            <tr key={index} aria-hidden="true">
              <td>&nbsp;</td><td /><td /><td /><td /><td />
            </tr>
          ))}
        </tbody>
      </table>

      <dl className={styles.totals}>
        <dt>小計</dt><dd>{formatYen(data.subtotalYen)}</dd>
        <dt>消費税</dt><dd>{formatYen(data.taxYen)}</dd>
        <dt className={styles.grandTotal}>合計</dt>
        <dd className={styles.grandTotal}>{formatYen(data.totalYen)}</dd>
      </dl>

      <section className={styles.notes}>
        <p className={styles.notesTitle}>備考</p>
        <p>{data.notes ?? ""}</p>
      </section>
      <p className={styles.demoNote}>税率・端数処理はデモ設定です。</p>
    </article>
  );
}
