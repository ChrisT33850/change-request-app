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

export const generateWordDocument = async (cr: CR) => {
  try {
    console.log('📄 Starting Word generation for CR:', cr.id);

    if (!cr || !cr.id) {
      throw new Error('Invalid CR data');
    }

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
                      children: [new Paragraph({ text: 'Deployment Planned', bold: true })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: cr.dates.deploymentPlanned || 'N/A' })],
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
                      children: [new Paragraph({ text: `€${cr.impact.budgetEur.toLocaleString()}` })],
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
                      children: [new Paragraph({ text: `${cr.impact.delayDays} days` })],
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

            ...(cr.impacts ? [
              new Paragraph({
                text: 'Impacts',
                bold: true,
                size: 24,
              }),
              new Table({
                rows: [
                  new TableRow({
                    cells: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Timeline', bold: true })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: cr.impacts.timeline || 'N/A' })],
                      }),
                    ],
                  }),
                  new TableRow({
                    cells: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Costs', bold: true })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: cr.impacts.costs || 'N/A' })],
                      }),
                    ],
                  }),
                  new TableRow({
                    cells: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Quality', bold: true })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: cr.impacts.quality || 'N/A' })],
                      }),
                    ],
                  }),
                  new TableRow({
                    cells: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Teams', bold: true })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: cr.impacts.teams || 'N/A' })],
                      }),
                    ],
                  }),
                  new TableRow({
                    cells: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Knowledge', bold: true })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: cr.impacts.knowledge || 'N/A' })],
                      }),
                    ],
                  }),
                ],
              }),
              new Paragraph({ text: '' }),
            ] : []),

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

            ...(cr.stakeholders && cr.stakeholders.length > 0 ? [
              new Paragraph({
                text: 'Stakeholders',
                bold: true,
                size: 24,
              }),
              new Paragraph({
                text: cr.stakeholders.join(', '),
              }),
              new Paragraph({ text: '' }),
            ] : []),

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

    console.log('📝 Document created, converting to Blob...');

    const blob = await Packer.toBlob(doc);
    console.log('✅ Blob created successfully:', blob.size, 'bytes');

    const fileName = `${cr.id}-${cr.title.replace(/\s+/g, '_')}.docx`;
    saveAs(blob, fileName);
    console.log('✅ File saved:', fileName);

  } catch (error) {
    console.error('❌ Error generating Word document:', error);
    alert(`Error generating Word document: ${error instanceof Error ? error.message : String(error)}`);
  }
};
