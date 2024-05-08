import fs from "node:fs";
import { parse } from "csv-parse";
import { jsPDF } from "jspdf";

const Y_START_POSITION = 20;
const X_START_POSITION = 10;
const LINE_HEIGHT = 10;
const HEADER_FONT_SIZE = 18;
const BODY_FONT_SIZE = 12;
const TRACKS = {
  WD: "Coding for Web",
  DA: "Data Analytics",
  DC: "Coding for Data",
  DM: "Digital Marketing",
};
const TERMS = {
  SP: "Spring",
  SU: "Summer",
  FA: "Fall",
};

const __dirname = new URL(".", import.meta.url).pathname;

const parseSheet = async (sheetName) => {
  const liveLabs = [];
  const deliverables = [];
  console.info(`Now parsing ${sheetName}`);
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
    deliverables: deliverables,
  };
};

// CREATE PDF
const generatePDF = async (sheet) => {
  const records = await parseSheet(sheet);
  const doc = new jsPDF();

  const addImageFooter = () => {
    const image = fs.readFileSync(__dirname + "gtx-stacked.png", "base64");
    const imageData = `data:image/png;base64,${image}`;
    doc.addImage(
      imageData,
      "png",
      doc.getPageWidth() - 45,
      doc.getPageHeight() - 20,
      35,
      10
    );
  };

  let yPosition = Y_START_POSITION;

  // Watch-by dates
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.setFont("helvetica", "bold");
  doc.text(
    "Part 2 SkillBuilder Watch-By Schedule",
    X_START_POSITION,
    yPosition
  );
  yPosition += 15;
  doc.setFontSize(BODY_FONT_SIZE);

  records.liveLabs.slice(12).forEach((lab, idx) => {
    let currentLineWidth;

    if (lab["Module Title (for Tech Team)"]) {
      doc.setFont("helvetica", "normal");
      doc.text("Watch ", X_START_POSITION, yPosition);
      currentLineWidth = doc.getTextWidth("Watch ");

      doc.setFont("helvetica", "bold");
      let moduleTitle = lab["Module Title (for Tech Team)"]
        .replace(/[^a-zA-Z0-9:\- ]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      doc.text(moduleTitle, X_START_POSITION + currentLineWidth, yPosition);
      currentLineWidth += doc.getTextWidth(moduleTitle);

      doc.setFont("helvetica", "normal");

      doc.text(
        "  before LiveLab on ",
        X_START_POSITION + currentLineWidth,
        yPosition
      );
      currentLineWidth += doc.getTextWidth("  before LiveLab on ");

      doc.setFont("helvetica", "bold");
      doc.text(
        lab["Event Start Date/Time"].split(" ")[0],
        X_START_POSITION + currentLineWidth,
        yPosition
      );

      yPosition += LINE_HEIGHT;
    }
  });
  addImageFooter();

  doc.save(`pdf-out/${sheet.split(".")[0].replace(/\[[^\]]*\]/g, "")}.pdf`);
  console.info(`${sheet} saved as PDF!`);
};

const main = () => {
  try {
    fs.readdir(__dirname + "sheets", (err, sheets) => {
      if (err) {
        console.error(err);
      } else {
        sheets
          .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
          .forEach((sheet) => {
            generatePDF(sheet);
          });
      }
    });
  } catch (err) {
    console.error(err);
  }
};

main();
