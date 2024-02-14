import fs from "node:fs";
import { parse } from "csv-parse";
import { jsPDF } from "jspdf";

const Y_START_POSITION = 20;
const X_START_POSITION = 10;
const LINE_HEIGHT = 10;
const HEADER_FONT_SIZE = 18;
const BODY_FONT_SIZE = 12;

const __dirname = new URL(".", import.meta.url).pathname;
const sheetName = "SP '24 - DM - Wave 1 - A [Calendar].csv";

const parseSheet = async (sheetName) => {
  const liveLabs = [];
  const deliverables = [];
  const parser = fs.createReadStream(`${__dirname}sheets/${sheetName}`).pipe(
    parse({
      bom: true,
      columns: true,
    })
  );
  for await (const record of parser) {
    if (
      record["Event Type"].toLowerCase() === "milestone" ||
      record["Event Type"].toLowerCase() === "portfolio project"
    ) {
      deliverables.push(record);
    }
    if (
      record["Event Type"].toLowerCase() === "livelab" &&
      !record[
        "Topic:    📅   LiveLab, 🌐  ICC Topic, 🎯  Milestone, or 🚀  Portfolio Project"
      ]
        .toLowerCase()
        .includes("pre-game")
    ) {
      liveLabs.push(record);
    }
  }
  return {
    liveLabs: liveLabs,
    liveLabCount: liveLabs.length,
    deliverables: deliverables,
  };
};

(async () => {
  const records = await parseSheet(sheetName);
  const doc = new jsPDF();
  let yPosition = Y_START_POSITION;
  console.log(records.liveLabs[1]);

  // Watch-by dates
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("DM Part 1 SkillBuilder Watch-By Schedule", 10, yPosition);
  yPosition += 15;
  doc.setFontSize(BODY_FONT_SIZE);

  records.liveLabs.slice(0, 12).forEach((lab, idx) => {
    doc.setFont("helvetica", "bold");
    doc.text(
      `Watch ${lab["Module Title (for Tech Team)"]} by ${
        lab["Event Start Date/Time"].split(" ")[0]
      }`,
      X_START_POSITION,
      yPosition
    );
    doc.setFont("helvetica", "normal");
    yPosition += LINE_HEIGHT;
    doc.text(
      `before LiveLab ${lab[
        "Topic:    📅   LiveLab, 🌐  ICC Topic, 🎯  Milestone, or 🚀  Portfolio Project"
      ]
        .replace(/[^a-zA-Z0-9(). ]/g, "")
        .replace(/\([^)]*\)/g, "")
        .replace(/\s+/g, " ")
        .trim()}`,
      X_START_POSITION,
      yPosition
    );
    yPosition += LINE_HEIGHT;
  });

  // Deliverables
  yPosition = Y_START_POSITION;
  doc.addPage();
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text("DM Part 1 Milestone Due Dates", 10, yPosition);
  yPosition += 15;
  doc.setFontSize(BODY_FONT_SIZE);

  records.deliverables.slice(0, 12).forEach((deliverable, idx) => {
    doc.setFont("helvetica", "bold");
    console.log(deliverable);
    let title = `${deliverable[
      "Topic:    📅   LiveLab, 🌐  ICC Topic, 🎯  Milestone, or 🚀  Portfolio Project"
    ]
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim()}`;
    doc.text(title, X_START_POSITION, yPosition);

    let titleWidth = doc.getTextWidth(title);
    doc.setFont("helvetica", "normal");
    doc.text(
      `  - ${deliverable["Event Start Date/Time"].replace(" ", " @ ")} CT`,
      X_START_POSITION + titleWidth,
      yPosition
    );
    yPosition += LINE_HEIGHT;
  });

  doc.save(`${sheetName.split(".")[0]}.pdf`);
})();
