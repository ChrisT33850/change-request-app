import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, HeadingLevel } from 'docx';
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
  impacts?: {
    timeline?: string;
    costs?: string;
    quality?: string;
    teams?: string;
    knowledge?: string;
  };
  implementation?: { description?: string; technicalOwner?: string };
  tests?: { report?: string; status?: string };
  risks?: string;
  stakeholders?: string[];
  workflow?: {
    awaitingValidation?: {
      signatures: { userName: string; timestamp: string; decision: string }[];
      requiredSignatories: string[];
    };
  };
}

// Small helper: builds a labeled row for the summary table
const infoRow = (label: string, value: string): TableRow =>
  new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
        width: { size: 30, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ text: value || 'N/A' })],
        width: { size: 70, type: WidthType.PERCENTAGE },
      }),
    ],
  });

const sectionTitle = (text: string): Paragraph =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24 })],
  });

export const generateWordDocument = (cr: CR) => {
  try {
    const signatures = cr.workflow?.awaitingValidation?.signatures || [];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: `Change Request: ${cr.id}`, bold: true, size: 32 })],
            }),
            new Paragraph({
              children: [new TextRun({ text: cr.title || '', size: 24, color: '00b0db' })],
              spacing: { after: 200 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                infoRow('Project', cr.project),
                infoRow('Status', cr.currentStatus),
                infoRow('Requester', cr.requesterName),
                infoRow('Created', cr.dates?.created || 'N/A'),
                infoRow('Budget (€)', cr.impact?.budgetEur?.toLocaleString() ?? '0'),
                infoRow('Days', cr.impact?.delayDays?.toString() ?? '0'),
              ],
            }),

            sectionTitle('Description'),
            new Paragraph({ text: cr.description || 'N/A' }),

            sectionTitle('Implementation'),
            new Paragraph({ text: cr.implementation?.description || 'N/A' }),

            sectionTitle('Risks'),
            new Paragraph({ text: cr.risks || 'N/A' }),

            ...(cr.stakeholders && cr.stakeholders.length > 0
              ? [
                  sectionTitle('Stakeholders'),
                  new Paragraph({ text: cr.stakeholders.join(', ') }),
                ]
              : []),

            ...(signatures.length > 0
              ? [
                  sectionTitle('Signatures'),
                  ...signatures.map(
                    (sig) =>
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `✔ ${sig.userName} — ${sig.decision} (${new Date(sig.timestamp).toLocaleString()})`,
                          }),
                        ],
                      })
                  ),
                ]
              : []),

            sectionTitle('Progress'),
            new Paragraph({ text: `${cr.progressPercentage ?? 0}% completed` }),
          ],
        },
      ],
    });

    Packer.toBlob(doc)
      .then((blob) => {
        const safeTitle = (cr.title || cr.id).replace(/[^a-z0-9_-]+/gi, '_');
        saveAs(blob, `${cr.id}-${safeTitle}.docx`);
      })
      .catch((err) => {
        console.error('Error generating Word document (Packer.toBlob):', err);
        alert('An error occurred while generating the Word document. Check the browser console for details.');
      });
  } catch (err) {
    console.error('Error generating Word document:', err);
    alert('An error occurred while generating the Word document. Check the browser console for details.');
  }
};
