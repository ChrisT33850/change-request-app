const GITHUB_TOKEN = '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'; // Minimal token (workflow trigger only)
const GITHUB_OWNER = 'ChrisT33850';
const GITHUB_REPO = 'change-request-app';
const GITHUB_BRANCH = 'main';

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
    timeline: string;
    costs: string;
    quality: string;
    teams: string;
    knowledge: string;
  };
  implementation?: { description: string; technicalOwner: string };
  tests?: { report: string; status: string };
  risks?: string;
  stakeholders?: string[];
  workflow?: { awaitingValidation?: { signatures: any[]; requiredSignatories: string[] } };
}

export const saveToGitHub = async (changeRequests: CR[]): Promise<boolean> => {
  try {
    const jsonData = JSON.stringify(changeRequests, null, 2);

    // Déclencher le GitHub Action workflow_dispatch
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/update-change-requests.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: GITHUB_BRANCH,
          inputs: {
            change_requests_data: jsonData,
          },
        }),
      }
    );

    if (response.ok || response.status === 204) {
      console.log('✅ Workflow triggered successfully');
      return true;
    } else {
      console.error('❌ Workflow trigger failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return false;
  }
};

export const loadFromGitHub = async (): Promise<CR[] | null> => {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/change-requests.json`
    );

    if (!response.ok) {
      console.error('Load failed:', response.status);
      return null;
    }
