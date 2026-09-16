import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface CR {
  id: string;
  title: string;
  project: string;
  description: string;
  currentStatus: string;
  progressPercentage: number;
  requesterName: string;
  dates: { created: string; deploymentPlanned: string | null };
  impact: { budgetEur: number; delayDays: number };
  impacts?: any;
  implementation?: any;
  tests?: any;
  risks?: string;
  stakeholders?: string[];
  workflow?: any;
}

export const generateWordDocument = (cr: CR) => {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: `Change Request: ${cr.id}`,
            bold: true,
            size: 32,
          }),
          new Paragraph({
            text: cr.title,
            size: 24,
            color: '00b0db',
          }),
          new Paragraph({ text: '' }),
          new Table({
            rows: [
              new TableRow({
                cells: [
                  new TableCell({
                    children: [new Paragraph({ text: 'Project', bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: cr.project })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                cells: [
                  new TableCell({
                    children: [new Paragraph({ text: 'Status', bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: cr.currentStatus })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                cells: [
                  new TableCell({
                    children: [new Paragraph({ text: 'Requester', bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: cr.requesterName })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                cells: [
                  new TableCell({
                    children: [new Paragraph({ text: 'Created', bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: cr.dates.created })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                cells: [
                  new TableCell({
                    children: [new Paragraph({ text: 'Budget (€)', bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: cr.impact.budgetEur.toString() })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                cells: [
                  new TableCell({
                    children: [new Paragraph({ text: 'Days', bold: true })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: cr.impact.delayDays.toString() })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'Description',
            bold: true,
            size: 24,
          }),
          new Paragraph({
            text: cr.description || 'N/A',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'Implementation',
            bold: true,
            size: 24,
          }),
          new Paragraph({
            text: cr.implementation?.description || 'N/A',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'Risks',
            bold: true,
            size: 24,
          }),
          new Paragraph({
            text: cr.risks || 'N/A',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'Progress',
            bold: true,
            size: 24,
          }),
          new Paragraph({
            text: `${cr.progressPercentage}% completed`,
          }),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `${cr.id}-${cr.title.replace(/\s+/g, '_')}.docx`);
  });
};
