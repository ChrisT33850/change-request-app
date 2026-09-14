import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';

interface Impacts {
  timeline: string;
  costs: string;
  quality: string;
  teams: string;
  knowledge: string;
}

interface Signature {
  userId: string;
  userName: string;
  decision: string;
  timestamp: string;
}

interface CR {
  id: string;
  title: string;
  project: string;
  description: string;
  currentStatus: string;
  progressPercentage: number;
  requesterName: string;
  dates: {
    created: string;
    deploymentPlanned: string | null;
  };
  impact: {
    budgetEur: number;
    delayDays: number;
  };
  impacts?: Impacts;
  implementation?: {
    description: string;
    technicalOwner: string;
  };
  tests?: {
    report: string;
    status: string;
  };
  risks?: string;
  stakeholders?: string[];
  workflow?: {
    awaitingValidation?: {
      signatures: Signature[];
      requiredSignatories: string[];
    };
  };
}

export const generateWordDocument = (cr: CR) => {
  const signedCount = cr.workflow?.awaitingValidation?.signatures.length || 0;
  const requiredCount = cr.workflow?.awaitingValidation?.requiredSignatories.length || 0;
  
  const pendingSigners = cr.workflow?.awaitingValidation?.requiredSignatories.filter(
    userId => !cr.workflow?.awaitingValidation?.signatures.some(s => s.userId === userId)
  ) || [];

  const doc = new Document({
    sections: [{
      children: [
        // Header
        new Paragraph({
          text: `CHANGE REQUEST - ${cr.id}`,
          bold: true,
          size: 28,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),

        // Title
        new Paragraph({
          text: cr.title,
          size: 24,
          bold: true,
          spacing: { after: 100 }
        }),

        // Info Table
        new Table({
          rows: [
            new TableRow({
              cells: [
                new TableCell({ 
                  children: [new Paragraph({ text: 'Project', bold: true })],
                  width: { size: 30, type: WidthType.PERCENTAGE }
                }),
                new TableCell({ 
                  children: [new Paragraph({ text: cr.project })],
                  width: { size: 70, type: WidthType.PERCENTAGE }
                }),
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph({ text: 'Requester', bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: cr.requesterName })] }),
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph({ text: 'Status', bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: cr.currentStatus })] }),
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph({ text: 'Created', bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: cr.dates.created })] }),
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph({ text: 'Deployment Date', bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: cr.dates.deploymentPlanned || 'N/A' })] }),
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph({ text: 'Budget', bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: `€${cr.impact.budgetEur.toLocaleString()}` })] }),
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph({ text: 'Days', bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: `${cr.impact.delayDays} days` })] }),
              ]
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE }
        }),

        new Paragraph({ text: '', spacing: { after: 200 } }),

        // Description
        new Paragraph({
          text: 'Description',
          bold: true,
          size: 20,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: cr.description,
          spacing: { after: 200 }
        }),

        // Impacts Table
        ...(cr.impacts ? [
          new Paragraph({
            text: 'Impact on Timeline',
            bold: true,
            size: 20,
            spacing: { after: 100 }
          }),
          new Table({
            rows: [
              new TableRow({
                cells: [
                  new TableCell({ children: [new Paragraph({ text: 'Impact on Timeline', bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: cr.impacts.timeline })] }),
                ]
              }),
              new TableRow({
                cells: [
                  new TableCell({ children: [new Paragraph({ text: 'Impact on Costs', bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: cr.impacts.costs })] }),
                ]
              }),
              new TableRow({
                cells: [
                  new TableCell({ children: [new Paragraph({ text: 'Impact on Quality / Performance', bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: cr.impacts.quality })] }),
                ]
              }),
              new TableRow({
                cells: [
                  new TableCell({ children: [new Paragraph({ text: 'Impact on Teams / Resources', bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: cr.impacts.teams })] }),
                ]
              }),
              new TableRow({
                cells: [
                  new TableCell({ children: [new Paragraph({ text: 'Impact on knowledge article', bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: cr.impacts.knowledge })] }),
                ]
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
          }),
          new Paragraph({ text: '', spacing: { after: 200 } }),
        ] : []),

        // Stakeholders
        ...(cr.stakeholders && cr.stakeholders.length > 0 ? [
          new Paragraph({
            text: 'Stakeholders',
            bold: true,
            size: 20,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: cr.stakeholders.join(', '),
            spacing: { after: 200 }
          }),
        ] : []),

        // Implementation
        new Paragraph({
          text: 'Implementation Plan',
          bold: true,
          size: 20,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: cr.implementation?.description || 'N/A',
          spacing: { after: 200 }
        }),

        // Tests
        new Paragraph({
          text: 'Tests',
          bold: true,
          size: 20,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `Report: ${cr.tests?.report || 'N/A'}`,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: `Status: ${cr.tests?.status || 'N/A'}`,
          spacing: { after: 200 }
        }),

        // Risks
        new Paragraph({
          text: 'Risks',
          bold: true,
          size: 20,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: cr.risks || 'N/A',
          spacing: { after: 200 }
        }),

        // Progress
        new Paragraph({
          text: 'Progress',
          bold: true,
          size: 20,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `${cr.progressPercentage}% completed`,
          spacing: { after: 200 }
        }),

        // Signatures
        new Paragraph({
          text: 'Signatures',
          bold: true,
          size: 20,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `Total Signatures: ${signedCount}/${requiredCount}`,
          spacing: { after: 100 }
        }),

        ...(signedCount > 0 ? [
          new Paragraph({
            text: 'Approved by:',
            bold: true,
            spacing: { after: 50 }
          }),
          ...(cr.workflow?.awaitingValidation?.signatures.map(sig =>
            new Paragraph({
              text: `• ${sig.userName} - ${sig.decision} (${new Date(sig.timestamp).toLocaleString()})`,
              spacing: { after: 50 }
            })
          ) || []),
          new Paragraph({ text: '', spacing: { after: 50 } }),
        ] : []),

        ...(pendingSigners.length > 0 ? [
          new Paragraph({
            text: 'Pending Signatures:',
            bold: true,
            spacing: { after: 50 }
          }),
          ...(pendingSigners.map(userId =>
            new Paragraph({
              text: `• ${userId}`,
              spacing: { after: 50 }
            })
          )),
        ] : []),

        new Paragraph({
          text: `Generated on ${new Date().toLocaleString()}`,
          italic: true,
          spacing: { before: 200 }
        })
      ]
    }]
  });

  Packer.toBlob(doc).then(blob => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${cr.id}_${cr.title.replace(/\s+/g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};
