const GITHUB_TOKEN = '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';
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
  dates: {
    created: string;
    deploymentPlanned: string | null;
  };
  impact: {
    budgetEur: number;
    delayDays: number;
  };
  impacts?: {
    timeline: string;
    costs: string;
    quality: string;
    teams: string;
    knowledge: string;
  };
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
      signatures: Array<{
        userId: string;
        userName: string;
        role: string;
        timestamp: string;
        decision: string;
        feedback: string;
      }>;
      requiredSignatories: string[];
    };
  };
}

export const saveToGitHub = async (changeRequests: CR[]): Promise<boolean> => {
  try {
    const filePath = 'data/change-requests.json';
    const content = JSON.stringify(changeRequests, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    // Récupérer le SHA du fichier existant
    const getShaResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    let sha: string | undefined;
    if (getShaResponse.ok) {
      const data = await getShaResponse.json();
      sha = data.sha;
    }

    // Uploader le fichier
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Auto-update: Change requests synchronized at ${new Date().toISOString()}`,
          content: encodedContent,
          branch: GITHUB_BRANCH,
          ...(sha && { sha }),
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('GitHub save error:', error);
    return false;
  }
};

export const loadFromGitHub = async (): Promise<CR[] | null> => {
  try {
    const filePath = 'data/change-requests.json';

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      }
    );

    if (!response.ok) {
      console.error('GitHub load error:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('GitHub load error:', error);
    return null;
  }
};
