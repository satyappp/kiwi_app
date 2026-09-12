import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import {
  blankRestingRange,
  formatLabelDateTime,
  formatLabelRange,
  formatLabelTemperature,
  formatLabelWeight,
  labelBreakdownLines,
} from "@/features/ripening/label-format";
import type { RipeningLabelData } from "@/features/ripening/schema";

const mm = (value: number) => (value * 72) / 25.4;
const PAGE_WIDTH = mm(210);
const PAGE_HEIGHT = mm(148);
const MARGIN = mm(6);
const LABEL_COLUMN = mm(25);
// The rows add up to the exact 136 mm printable height inside the 6 mm margins.
const ROW_HEIGHTS = [9, 9, 9, 9, 10.5, 12, 12, 12, 10.5, 34, 9].map(
  mm,
);
const INK = rgb(0.07, 0.07, 0.07);
const FONT_PATH = path.join(
  process.cwd(),
  "public/fonts/NotoSansJP-Regular.ttf",
);
let fontBytesPromise: ReturnType<typeof readFile> | undefined;

function readLabelFont() {
  fontBytesPromise ??= readFile(FONT_PATH);
  return fontBytesPromise;
}

function fitSize(font: PDFFont, text: string, maxWidth: number, preferred: number) {
  let size = preferred;
  while (size > 7 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25;
  return size;
}

function drawCenteredText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  bottom: number,
  width: number,
  height: number,
  preferredSize: number,
) {
  const size = fitSize(font, text, width - mm(4.8), preferredSize);
  page.drawText(text, {
    x: x + mm(2.4),
    y: bottom + (height - size) / 2 + 0.8,
    size,
    font,
    color: INK,
  });
}

export async function createRipeningLabelPdf(data: RipeningLabelData) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  document.setTitle(`${data.title} 追熟ラベル`);
  document.setAuthor("ReFruits");
  document.setSubject("追熟コンテナラベル");

  const fontBytes = await readLabelFont();
  // Fontkit's CJK subsetting can drop glyphs. Embed the static font intact so
  // printed labels always preserve Japanese names entered by the farm.
  const font = await document.embedFont(fontBytes, { subset: false });
  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const left = MARGIN;
  const right = PAGE_WIDTH - MARGIN;
  const top = PAGE_HEIGHT - MARGIN;
  const tableWidth = right - left;
  const valueLeft = left + LABEL_COLUMN;

  const lines = labelBreakdownLines(data);
  const rows = [
    { label: "追熟ID", value: "" },
    { label: "園地", value: data.plotNames.join("・") || "-" },
    { label: "品種", value: data.varietyName },
    { label: "等級", value: data.sizeCodes.join("・") || "-" },
    { label: "量", value: `${formatLabelWeight(data.weightKg)} kg`, size: 15.5 },
    { label: "寝かせ", value: blankRestingRange },
    {
      label: "エチレン",
      value: `${formatLabelTemperature(data.ethyleneTemperatureC)}　${formatLabelRange(data.ethyleneStartedAt, data.ethyleneEndedAt)}`,
    },
    {
      label: "再寝かせ",
      value: `${formatLabelTemperature(data.restingTemperatureC)}　${formatLabelRange(data.restingStartedAt, data.shippableAt)}`,
    },
    { label: "出荷予定", value: `${formatLabelDateTime(data.shippableAt)} ～` },
    { label: "内訳", value: "", isBreakdown: true },
    { label: "コードNo.", value: "" },
  ];

  page.drawRectangle({
    x: left,
    y: MARGIN,
    width: tableWidth,
    height: top - MARGIN,
    borderColor: INK,
    borderWidth: 1,
  });
  page.drawLine({
    start: { x: valueLeft, y: MARGIN },
    end: { x: valueLeft, y: top },
    color: INK,
    thickness: 0.8,
  });

  let rowTop = top;
  rows.forEach((row, index) => {
    const height = ROW_HEIGHTS[index];
    const bottom = rowTop - height;
    if (index > 0) {
      page.drawLine({
        start: { x: left, y: rowTop },
        end: { x: right, y: rowTop },
        color: INK,
        thickness: 0.8,
      });
    }

    drawCenteredText(
      page,
      font,
      row.label,
      left,
      bottom,
      LABEL_COLUMN,
      height,
      10.5,
    );

    if (row.isBreakdown) {
      const lineHeight = height / 5;
      for (let lineIndex = 0; lineIndex < 5; lineIndex += 1) {
        if (lineIndex > 0) {
          page.drawLine({
            start: { x: valueLeft, y: rowTop - lineHeight * lineIndex },
            end: { x: right, y: rowTop - lineHeight * lineIndex },
            color: rgb(0.35, 0.35, 0.35),
            thickness: 0.7,
            dashArray: [2.4, 2.8],
          });
        }
        drawCenteredText(
          page,
          font,
          lines[lineIndex] ?? "",
          valueLeft,
          rowTop - lineHeight * (lineIndex + 1),
          right - valueLeft,
          lineHeight,
          10,
        );
      }
    } else {
      drawCenteredText(
        page,
        font,
        row.value,
        valueLeft,
        bottom,
        right - valueLeft,
        height,
        row.size ?? 11.5,
      );
    }
    rowTop = bottom;
  });

  return document.save();
}
