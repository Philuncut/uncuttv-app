import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import PDFDocument from 'pdfkit'
import { AGB, DATENSCHUTZ } from './content.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = __dirname
const CREATED = new Date().toLocaleDateString('de-AT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const PAGE = {
  width: 595.28,
  height: 841.89,
  marginTop: 72,
  marginBottom: 64,
  marginLeft: 56,
  marginRight: 56,
}

const COLORS = {
  text: '#2c2c2c',
  muted: '#666666',
  accent: '#c0392b',
  line: '#dddddd',
}

function contentWidth() {
  return PAGE.width - PAGE.marginLeft - PAGE.marginRight
}

function drawHeaderFooter(doc, docTitle, pageNum) {
  const yHeader = 36
  const yFooter = PAGE.height - 40

  doc.save()
  doc.strokeColor(COLORS.line).lineWidth(0.5)
  doc.moveTo(PAGE.marginLeft, 52).lineTo(PAGE.width - PAGE.marginRight, 52).stroke()
  doc.moveTo(PAGE.marginLeft, yFooter - 8).lineTo(PAGE.width - PAGE.marginRight, yFooter - 8).stroke()

  doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8)
  doc.text(docTitle, PAGE.marginLeft, yHeader, { width: contentWidth() / 2, align: 'left' })
  doc.text(`Erstellt: ${CREATED}`, PAGE.marginLeft + contentWidth() / 2, yHeader, {
    width: contentWidth() / 2,
    align: 'right',
  })

  doc.font('Helvetica').fontSize(8)
  doc.text(`Seite ${pageNum}`, PAGE.marginLeft, yFooter, { width: contentWidth(), align: 'center' })
  doc.restore()
}

function ensureSpace(doc, docTitle, needed, state) {
  const bottom = PAGE.height - PAGE.marginBottom
  if (doc.y + needed > bottom) {
    drawHeaderFooter(doc, docTitle, state.page)
    doc.addPage()
    state.page += 1
    doc.y = PAGE.marginTop
    drawHeaderFooter(doc, docTitle, state.page)
  }
}

function writeParagraph(doc, docTitle, text, state, options = {}) {
  const fontSize = options.fontSize ?? 10.5
  const lineGap = options.lineGap ?? 4
  const color = options.color ?? COLORS.text
  const font = options.bold ? 'Helvetica-Bold' : 'Helvetica'

  doc.font(font).fontSize(fontSize).fillColor(color)
  const height = doc.heightOfString(text, { width: contentWidth(), lineGap })
  ensureSpace(doc, docTitle, height + 8, state)
  doc.text(text, PAGE.marginLeft, doc.y, { width: contentWidth(), lineGap })
  doc.moveDown(0.6)
}

function writeList(doc, docTitle, items, state) {
  const bulletIndent = 14
  const fontSize = 10.5
  const lineGap = 4

  doc.font('Helvetica').fontSize(fontSize).fillColor(COLORS.text)

  for (const item of items) {
    const text = `•  ${item}`
    const height = doc.heightOfString(text, {
      width: contentWidth() - bulletIndent,
      lineGap,
      indent: bulletIndent,
    })
    ensureSpace(doc, docTitle, height + 6, state)
    doc.text(text, PAGE.marginLeft, doc.y, {
      width: contentWidth(),
      lineGap,
      indent: bulletIndent,
    })
    doc.moveDown(0.25)
  }
  doc.moveDown(0.35)
}

function writeBox(doc, docTitle, lines, state) {
  const padding = 10
  const fontSize = 10.5
  const lineGap = 6
  const text = lines.join('\n')
  const textHeight = doc.font('Helvetica').fontSize(fontSize).heightOfString(text, {
    width: contentWidth() - padding * 2,
    lineGap,
  })
  const boxHeight = textHeight + padding * 2

  ensureSpace(doc, docTitle, boxHeight + 10, state)
  const boxY = doc.y
  doc.save()
  doc.rect(PAGE.marginLeft, boxY, contentWidth(), boxHeight).fillAndStroke('#f7f7f7', COLORS.line)
  doc.restore()
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(fontSize)
  doc.text(text, PAGE.marginLeft + padding, boxY + padding, {
    width: contentWidth() - padding * 2,
    lineGap,
  })
  doc.y = boxY + boxHeight + 10
}

function writeSection(doc, docTitle, section, state) {
  const sectionTitle = section.title.toUpperCase()
  writeParagraph(doc, docTitle, sectionTitle, state, {
    fontSize: 8.5,
    color: COLORS.muted,
    bold: true,
    lineGap: 2,
  })
  doc.moveDown(0.15)

  for (const block of section.blocks) {
    if (block.type === 'p') {
      writeParagraph(doc, docTitle, block.text, state)
    } else if (block.type === 'ul') {
      writeList(doc, docTitle, block.items, state)
    } else if (block.type === 'box') {
      writeBox(doc, docTitle, block.lines, state)
    }
  }

  doc.moveDown(0.5)
}

function generatePdf(filename, docMeta) {
  return new Promise((resolve, reject) => {
    const outPath = path.join(OUT_DIR, filename)
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: PAGE.marginTop,
        bottom: PAGE.marginBottom,
        left: PAGE.marginLeft,
        right: PAGE.marginRight,
      },
      bufferPages: true,
      info: {
        Title: docMeta.title,
        Author: 'UncutTV GmbH',
        Subject: docMeta.title,
        CreationDate: new Date(),
      },
    })

    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)

    const state = { page: 1 }
    drawHeaderFooter(doc, docMeta.title, state.page)

    doc.y = PAGE.marginTop

    doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(22)
    doc.text(docMeta.title, PAGE.marginLeft, doc.y, { width: contentWidth() })
    doc.moveDown(0.4)

    if (docMeta.subtitle) {
      writeParagraph(doc, docMeta.title, docMeta.subtitle, state, {
        fontSize: 10,
        color: COLORS.muted,
      })
    }

    if (docMeta.stand) {
      const standParts = docMeta.stand.includes('Vorabversion')
        ? docMeta.stand
        : docMeta.stand
      writeParagraph(doc, docMeta.title, standParts, state, {
        fontSize: 9.5,
        color: COLORS.muted,
      })
    }

    doc.moveDown(0.8)

    for (const section of docMeta.sections) {
      writeSection(doc, docMeta.title, section, state)
    }

    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      drawHeaderFooter(doc, docMeta.title, i + 1)
    }

    doc.end()
    stream.on('finish', () => resolve(outPath))
    stream.on('error', reject)
  })
}

async function main() {
  const agbPath = await generatePdf('AGB.pdf', AGB)
  const dsPath = await generatePdf('Datenschutz.pdf', DATENSCHUTZ)
  console.log('Erstellt:', agbPath)
  console.log('Erstellt:', dsPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
