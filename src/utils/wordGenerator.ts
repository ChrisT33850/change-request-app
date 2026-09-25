// Generates a native "Word 2003 XML" (WordML) document — no external library
// (no 'docx', no 'file-saver'). Word opens this format directly.

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
  benefits?: string;
  communicationRequired?: string; // 'Yes' | 'No'
  justificationOfChange?: string;
  listOfChanges?: string;
  impactedFlow?: string;
  impactedFlowVersion?: string;
  implementationDate?: string;
  newFlowVersion?: string;
  testDate?: string;
  testComments?: string;
  stakeholders?: string[];
  workflow?: {
    awaitingValidation?: {
      signatures: { userName: string; timestamp: string; decision: string }[];
      requiredSignatories: string[];
    };
    testingValidation?: {
      signatures: { userName: string; timestamp: string; decision: string }[];
      requiredSignatories: string[];
    };
  };
}

// --- ACTEON brand palette (hex, no '#') ---
const COLOR_TEAL = '2B8FA8';
const COLOR_ACCENT = '00A0D2';
const COLOR_DARK = '1F1F1F';
const COLOR_LIGHT_GREY = 'E8EEF1';
const COLOR_WHITE = 'FFFFFF';
const COLOR_GREY_TEXT = '888888';

// Escapes text so it is safe to place inside XML content
const esc = (value: string | number | null | undefined): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

interface ParaOptions {
  bold?: boolean;
  italics?: boolean;
  size?: number; // half-points, e.g. 22 = 11pt
  color?: string;
  align?: 'left' | 'center' | 'right';
  spacingBefore?: number; // twentieths of a point
  spacingAfter?: number;
  borderBottomColor?: string;
  borderBottomSize?: number;
}

// Builds a single <w:p> paragraph with one styled run
const para = (text: string, opts: ParaOptions = {}): string => {
  const {
    bold = false,
    italics = false,
    size = 21,
    color = COLOR_DARK,
    align,
    spacingBefore = 0,
    spacingAfter = 120,
    borderBottomColor,
    borderBottomSize = 6,
  } = opts;

  const pBdr = borderBottomColor
    ? `<w:pBdr><w:bottom w:val="single" w:sz="${borderBottomSize}" w:space="4" w:color="${borderBottomColor}"/></w:pBdr>`
    : '';
  const jc = align ? `<w:jc w:val="${align}"/>` : '';

  return `<w:p><w:pPr>${pBdr}<w:spacing w:before="${spacingBefore}" w:after="${spacingAfter}"/>${jc}</w:pPr>` +
    `<w:r><w:rPr>${bold ? '<w:b/>' : ''}${italics ? '<w:i/>' : ''}<w:color w:val="${color}"/><w:sz w:val="${size}"/></w:rPr>` +
    `<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
};

// A section title with a teal underline rule
const sectionTitle = (text: string): string =>
  para(text, { bold: true, size: 24, color: COLOR_TEAL, spacingBefore: 280, spacingAfter: 100, borderBottomColor: COLOR_TEAL });

const bodyText = (text?: string): string => para(text || 'N/A', { size: 21, color: COLOR_DARK, spacingAfter: 160 });

// One labeled row of the summary table (teal label cell / light grey value cell)
const infoRow = (label: string, value: string): string => `
<w:tr>
  <w:tc>
    <w:tcPr><w:tcW w:w="2800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${COLOR_TEAL}"/></w:tcPr>
    <w:p><w:pPr><w:spacing w:after="40"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="${COLOR_WHITE}"/><w:sz w:val="21"/></w:rPr><w:t xml:space="preserve">${esc(label)}</w:t></w:r></w:p>
  </w:tc>
  <w:tc>
    <w:tcPr><w:tcW w:w="7280" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${COLOR_LIGHT_GREY}"/></w:tcPr>
    <w:p><w:pPr><w:spacing w:after="40"/></w:pPr><w:r><w:rPr><w:sz w:val="21"/></w:rPr><w:t xml:space="preserve">${esc(value || 'N/A')}</w:t></w:r></w:p>
  </w:tc>
</w:tr>`;

const buildDocumentXml = (cr: CR): string => {
  const signatures = cr.workflow?.awaitingValidation?.signatures || [];
  const testSignatures = cr.workflow?.testingValidation?.signatures || [];
  const commRequired = cr.communicationRequired || 'No';

  const header = [
    para('CHANGE REQUEST', { bold: true, size: 18, color: COLOR_ACCENT, spacingAfter: 40 }),
    para(cr.id, { bold: true, size: 40, color: COLOR_DARK, spacingAfter: 40 }),
    para(cr.title || '', { italics: true, size: 24, color: COLOR_TEAL, spacingAfter: 240, borderBottomColor: COLOR_TEAL, borderBottomSize: 10 }),
  ].join('');

  const summaryTable = `
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="10080" w:type="dxa"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:color="CCCCCC"/>
      <w:left w:val="single" w:sz="4" w:color="CCCCCC"/>
      <w:bottom w:val="single" w:sz="4" w:color="CCCCCC"/>
      <w:right w:val="single" w:sz="4" w:color="CCCCCC"/>
      <w:insideH w:val="single" w:sz="4" w:color="CCCCCC"/>
      <w:insideV w:val="single" w:sz="4" w:color="CCCCCC"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tblGrid><w:gridCol w:w="2800"/><w:gridCol w:w="7280"/></w:tblGrid>
  ${infoRow('Project', cr.project)}
  ${infoRow('Status', cr.currentStatus)}
  ${infoRow('Requester', cr.requesterName)}
  ${infoRow('Created', cr.dates?.created || 'N/A')}
  ${infoRow('Budget (\u20ac)', cr.impact?.budgetEur?.toLocaleString() ?? '0')}
  ${infoRow('Days', cr.impact?.delayDays?.toString() ?? '0')}
  ${infoRow('User Communication Required', commRequired === 'Yes' ? 'Yes' : 'No')}
</w:tbl>
<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`;

  const signatoriesSection = cr.stakeholders && cr.stakeholders.length > 0
    ? sectionTitle('The Signatory') + bodyText(cr.stakeholders.join(', '))
    : '';

  const signaturesSection = signatures.length > 0
    ? sectionTitle('Signatures (Awaiting Validation)') + signatures.map((sig) =>
        para(`\u2713 ${sig.userName} \u2014 ${sig.decision} (${new Date(sig.timestamp).toLocaleString()})`, { size: 20, spacingAfter: 80 })
      ).join('')
    : '';

  const testSignaturesSection = testSignatures.length > 0
    ? sectionTitle('Signatures (Testing Sign-off)') + testSignatures.map((sig) =>
        para(`\u2713 ${sig.userName} \u2014 ${sig.decision} (${new Date(sig.timestamp).toLocaleString()})`, { size: 20, spacingAfter: 80 })
      ).join('')
    : '';

  const implementationRecord = (cr.implementationDate || cr.newFlowVersion)
    ? sectionTitle('Implementation Record') + bodyText(`Date: ${cr.implementationDate || 'N/A'} \u2014 New Flow Version: ${cr.newFlowVersion || 'N/A'}`)
    : '';

  const testingRecord = (cr.testDate || cr.testComments)
    ? sectionTitle('Testing Record') + bodyText(`Date: ${cr.testDate || 'N/A'} \u2014 Comments: ${cr.testComments || 'N/A'}`)
    : '';

  const footer = para(
    `Generated on ${new Date().toLocaleString()} \u2014 Change Request Dashboard`,
    { italics: true, size: 16, color: COLOR_GREY_TEXT, align: 'center', spacingBefore: 400 }
  );

  const body = [
    header,
    summaryTable,
    sectionTitle('Description'), bodyText(cr.description),
    sectionTitle('Benefits'), bodyText(cr.benefits),
    sectionTitle('Justification of Change'), bodyText(cr.justificationOfChange),
    sectionTitle('List of Changes'), bodyText(cr.listOfChanges),
    sectionTitle('Impacted Flow'), bodyText(`${cr.impactedFlow || 'N/A'} ${cr.impactedFlowVersion ? `(Version: ${cr.impactedFlowVersion})` : ''}`.trim()),
    sectionTitle('Implementation'), bodyText(cr.implementation?.description),
    implementationRecord,
    sectionTitle('Risks'), bodyText(cr.risks),
    testingRecord,
    signatoriesSection,
    signaturesSection,
    testSignaturesSection,
    sectionTitle('Progress'), bodyText(`${cr.progressPercentage ?? 0}% completed`),
    footer,
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument
  xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:sl="http://schemas.microsoft.com/schemaLibrary/2003/core"
  xmlns:aml="http://schemas.microsoft.com/aml/2001/core"
  xmlns:wx="http://schemas.microsoft.com/office/word/2003/auxHint"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:v="urn:schemas-microsoft-com:vml"
  w:macrosPresent="no" w:embeddedObjPresent="no" w:ocxPresent="no" xml:space="preserve">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:bottom="1080" w:left="1080" w:right="1080"/>
    </w:sectPr>
  </w:body>
</w:wordDocument>`;
};

export const generateWordDocument = (cr: CR): void => {
  try {
    const xml = buildDocumentXml(cr);
    // UTF-8 BOM so Word/Windows recognizes the encoding correctly
    const blob = new Blob(['\ufeff', xml], { type: 'application/vnd.ms-word;charset=utf-8' });
    const safeTitle = (cr.title || cr.id).replace(/[^a-z0-9_-]+/gi, '_');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cr.id}-${safeTitle}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating Word document:', err);
    alert('An error occurred while generating the Word document. Check the browser console for details.');
  }
};
