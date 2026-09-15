import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

import { deliveryNoteIssuer } from "@/features/delivery-notes/config";
import {
  formatJapaneseDate,
  formatKg,
  formatYen,
} from "@/features/delivery-notes/format";
import type { DeliveryNoteDocument } from "@/features/delivery-notes/schema";

const mm = (value: number) => (value * 72) / 25.4;
const PAGE_WIDTH = mm(210);
const PAGE_HEIGHT = mm(297);
const LEFT = mm(16);
const RIGHT = PAGE_WIDTH - mm(16);
const INK = rgb(0.08, 0.08, 0.08);
const MUTED = rgb(0.36, 0.39, 0.34);
const GRID = rgb(0.3, 0.3, 0.3);
const PAPER_TINT = rgb(0.96, 0.97, 0.94);
const STAMP = rgb(0.7, 0.3, 0.3);
const FONT_PATH = path.join(process.cwd(), "public/fonts/NotoSansJP-Regular.ttf");
let fontBytesPromise: ReturnType<typeof readFile> | undefined;

function readDocumentFont() {
  fontBytesPromise ??= readFile(FONT_PATH);
  return fontBytesPromise;
}

function fitSize(font: PDFFont, text: string, maxWidth: number, preferred: number, minimum = 6) {
  let size = preferred;
  while (size > minimum && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25;
  return size;
}

function drawText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size = 9, color = INK) {
  page.drawText(text, { x, y, size, font, color });
}

function drawFitText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, width: number, preferred = 9, color = INK) {
  drawText(page, font, text, x, y, fitSize(font, text, width, preferred), color);
}

function drawRight(page: PDFPage, font: PDFFont, text: string, right: number, y: number, size = 9, color = INK) {
  drawText(page, font, text, right - font.widthOfTextAtSize(text, size), y, size, color);
}

function drawCentered(page: PDFPage, font: PDFFont, text: string, x: number, y: number, width: number, size = 9, color = INK) {
  drawText(page, font, text, x + (width - font.widthOfTextAtSize(text, size)) / 2, y, size, color);
}

function drawCellText(page: PDFPage, font: PDFFont, text: string, x: number, bottom: number, width: number, height: number, align: "left" | "center" | "right" = "left", preferred = 8.5) {
  const size = fitSize(font, text, width - mm(3), preferred);
  const textWidth = font.widthOfTextAtSize(text, size);
  const textX = align === "right"
    ? x + width - textWidth - mm(1.5)
    : align === "center"
      ? x + (width - textWidth) / 2
      : x + mm(1.5);
  drawText(page, font, text, textX, bottom + (height - size) / 2 + 0.5, size);
}

export async function createDeliveryNotePdf(data: DeliveryNoteDocument) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  document.setTitle(`納品証_${data.deliveryDate}_${data.recipientName}`);
  document.setAuthor(deliveryNoteIssuer.companyName);
  document.setSubject(`${data.recipientName}宛 納品書`);

  const font = await document.embedFont(await readDocumentFont(), { subset: false });
  const latinFont = await document.embedFont(StandardFonts.Helvetica);
  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const contentWidth = RIGHT - LEFT;

  drawCentered(page, font, "納品書", LEFT, mm(270), contentWidth, 20);

  drawFitText(page, font, `${data.recipientName} ${data.recipientHonorific}`, LEFT, mm(246), mm(92), 12.5);
  page.drawLine({ start: { x: LEFT, y: mm(243) }, end: { x: LEFT + mm(92), y: mm(243) }, thickness: 1, color: INK });
  const recipientAddress = [data.recipientPostalCode, data.recipientAddress].filter(Boolean);
  recipientAddress.forEach((line, index) => drawFitText(page, font, line ?? "", LEFT, mm(236 - index * 5), mm(92), 8, MUTED));
  drawText(page, font, "下記の通り納品いたします。", LEFT, mm(211), 9);

  const metaLabelX = mm(120);
  const metaRight = RIGHT;
  const metaRows: Array<[string, string, PDFFont]> = [
    ["納品日", formatJapaneseDate(data.deliveryDate), font],
    ["納品書番号", data.documentNumber, latinFont],
    ["登録番号", deliveryNoteIssuer.registrationNumber, latinFont],
  ];
  metaRows.forEach(([label, value, valueFont], index) => {
    const y = mm(249 - index * 6);
    drawText(page, font, label, metaLabelX, y, 8.2);
    drawRight(page, valueFont, value, metaRight, y, 8.2);
  });

  drawText(page, font, deliveryNoteIssuer.companyName, metaLabelX, mm(225), 10.5);
  drawText(page, font, deliveryNoteIssuer.postalCode, metaLabelX, mm(219), 7.5, MUTED);
  drawFitText(page, font, deliveryNoteIssuer.address, metaLabelX, mm(214), mm(67), 7.5, MUTED);
  drawText(page, font, `電話：${deliveryNoteIssuer.phone}`, metaLabelX, mm(209), 7.5, MUTED);
  drawText(page, font, `メール：${deliveryNoteIssuer.email}`, metaLabelX, mm(204), 7.5, MUTED);
  page.drawRectangle({ x: RIGHT - mm(12), y: mm(219), width: mm(12), height: mm(12), borderColor: STAMP, borderWidth: 1.1 });
  drawCentered(page, font, "印", RIGHT - mm(12), mm(223), mm(12), 7.5, STAMP);

  drawText(page, font, "件名", LEFT, mm(194), 9.5);
  drawFitText(page, font, data.subject, LEFT + mm(18), mm(194), contentWidth - mm(18), 9.5);
  page.drawLine({ start: { x: LEFT, y: mm(191) }, end: { x: RIGHT, y: mm(191) }, thickness: 0.8, color: GRID });

  const summaryY = mm(174);
  const summaryWidth = mm(102);
  const summaryCellWidth = summaryWidth / 3;
  const summaryValues = [
    ["小計", formatYen(data.subtotalYen)],
    ["消費税", formatYen(data.taxYen)],
    ["合計金額", formatYen(data.totalYen)],
  ];
  summaryValues.forEach(([label, value], index) => {
    const x = LEFT + summaryCellWidth * index;
    page.drawRectangle({ x, y: summaryY, width: summaryCellWidth, height: mm(14), borderColor: GRID, borderWidth: 0.7 });
    page.drawRectangle({ x, y: summaryY + mm(8), width: summaryCellWidth, height: mm(6), color: PAPER_TINT });
    drawCentered(page, font, label, x, summaryY + mm(9.8), summaryCellWidth, 7.5);
    drawCentered(page, font, value, x, summaryY + mm(2.5), summaryCellWidth, 10);
  });

  const tableTop = mm(164);
  const headerHeight = mm(8);
  const rowHeight = mm(8.5);
  const columnWidths = [82, 18, 16, 25, 16, 21].map(mm);
  const headers = ["品名", "数量", "単位", "単価", "税率", "金額"];
  let x = LEFT;
  headers.forEach((header, index) => {
    page.drawRectangle({ x, y: tableTop - headerHeight, width: columnWidths[index], height: headerHeight, color: PAPER_TINT, borderColor: GRID, borderWidth: 0.65 });
    drawCellText(page, font, header, x, tableTop - headerHeight, columnWidths[index], headerHeight, "center", 8);
    x += columnWidths[index];
  });

  const aligns = ["left", "right", "center", "right", "right", "right"] as const;
  for (let rowIndex = 0; rowIndex < 9; rowIndex += 1) {
    const bottom = tableTop - headerHeight - rowHeight * (rowIndex + 1);
    x = LEFT;
    columnWidths.forEach((width, columnIndex) => {
      page.drawRectangle({ x, y: bottom, width, height: rowHeight, borderColor: GRID, borderWidth: 0.55 });
      const item = data.items[rowIndex];
      if (item) {
        const values = [
          item.description,
          formatKg(item.quantity),
          item.unit,
          formatYen(item.unitPriceYen),
          `${item.taxRate * 100}%`,
          formatYen(item.subtotalYen),
        ];
        drawCellText(page, font, values[columnIndex], x, bottom, width, rowHeight, aligns[columnIndex], 8);
      }
      x += width;
    });
  }

  const totalsRight = RIGHT;
  const totalsLeft = RIGHT - mm(82);
  const totalLabelWidth = mm(40);
  const totals = [
    ["小計", formatYen(data.subtotalYen)],
    ["消費税", formatYen(data.taxYen)],
    ["合計", formatYen(data.totalYen)],
  ];
  totals.forEach(([label, value], index) => {
    const bottom = mm(63 - index * 8);
    const height = mm(8);
    page.drawRectangle({ x: totalsLeft, y: bottom, width: totalLabelWidth, height, color: PAPER_TINT, borderColor: GRID, borderWidth: 0.65 });
    page.drawRectangle({ x: totalsLeft + totalLabelWidth, y: bottom, width: totalsRight - totalsLeft - totalLabelWidth, height, borderColor: GRID, borderWidth: 0.65 });
    drawCellText(page, font, label, totalsLeft, bottom, totalLabelWidth, height, "left", index === 2 ? 9 : 8);
    drawCellText(page, font, value, totalsLeft + totalLabelWidth, bottom, totalsRight - totalsLeft - totalLabelWidth, height, "right", index === 2 ? 9.5 : 8.5);
  });

  page.drawRectangle({ x: LEFT, y: mm(15), width: contentWidth, height: mm(25), borderColor: GRID, borderWidth: 0.65 });
  drawText(page, font, "備考", LEFT + mm(3), mm(34), 8.5);
  drawFitText(page, font, data.notes ?? "", LEFT + mm(3), mm(26), contentWidth - mm(6), 8);
  drawRight(page, font, "税率・端数処理はデモ設定です。", RIGHT, mm(9), 6.5, MUTED);

  return document.save();
}
