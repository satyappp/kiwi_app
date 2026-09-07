import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import {
  formatHarvestLabelDate,
  formatHarvestLabelTime,
  formatHarvestLabelWeight,
  harvestLabelBreakdownLines,
} from "@/features/harvest/label-format";
import type { HarvestLabelData } from "@/features/harvest/schema";

const mm = (value: number) => (value * 72) / 25.4;
const PAGE_WIDTH = mm(297);
const PAGE_HEIGHT = mm(210);
const MARGIN = mm(8);
const LABEL_COLUMN = mm(36);
const ROW_HEIGHTS = [13, 13, 13, 13, 17, 13, 13, 13, 15, 15, 44, 12].map(
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
  while (size > 8 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25;
  return size;
}

function drawText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  bottom: number,
  width: number,
  height: number,
  preferredSize: number,
) {
  const size = fitSize(font, text, width - mm(6.8), preferredSize);
  page.drawText(text, {
    x: x + mm(3.4),
    y: bottom + (height - size) / 2 + 0.8,
    size,
    font,
    color: INK,
  });
}

export async function createHarvestLabelPdf(data: HarvestLabelData) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  document.setTitle(`${data.title} 収穫ラベル`);
  document.setAuthor("ReFruits");
  document.setSubject("収穫コンテナラベル");

  const fontBytes = await readLabelFont();
  const font = await document.embedFont(fontBytes, { subset: false });
  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const left = MARGIN;
  const right = PAGE_WIDTH - MARGIN;
  const top = PAGE_HEIGHT - MARGIN;
  const valueLeft = left + LABEL_COLUMN;
  const lines = harvestLabelBreakdownLines(data);
  const rows = [
    { label: "収穫ID", value: "" },
    { label: "作業日", value: formatHarvestLabelDate(data.workDate) },
    { label: "作業時間", value: formatHarvestLabelTime(data.workTime) },
    { label: "担当者", value: data.staffName },
    { label: "園地", value: data.plotName },
    { label: "樹体", value: data.treeBlockName ?? "" },
    { label: "品種", value: data.varietyName },
    { label: "枝", value: data.branch ?? "" },
    {
      label: "量",
      value: `${formatHarvestLabelWeight(data.weightKg)} kg`,
      size: 22,
    },
    {
      label: "選果期限",
      value: formatHarvestLabelDate(data.sortingDeadline),
    },
    { label: "内訳", value: "", isBreakdown: true },
    { label: "コードNo.", value: "" },
  ];

  page.drawRectangle({
    x: left,
    y: MARGIN,
    width: right - left,
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

    drawText(page, font, row.label, left, bottom, LABEL_COLUMN, height, 15);
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
        drawText(
          page,
          font,
          lines[lineIndex] ?? "",
          valueLeft,
          rowTop - lineHeight * (lineIndex + 1),
          right - valueLeft,
          lineHeight,
          14.4,
        );
      }
    } else {
      drawText(
        page,
        font,
        row.value,
        valueLeft,
        bottom,
        right - valueLeft,
        height,
        row.size ?? 16.4,
      );
    }
    rowTop = bottom;
  });

  return document.save();
}
