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

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  crId: string;
  details: string;
}

export const exportDataAsJSON = (changeRequests: CR[], auditLogs: AuditLog[]) => {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    changeRequests,
    auditLogs,
  };

  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  link.href = url;
  link.download = `change-requests-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getGitHubUploadInstructions = (filename: string): string => {
  return `
📋 INSTRUCTIONS TO UPLOAD TO GITHUB:

1. Go to: https://github.com/ChrisT33850/change-request-app
2. Navigate to: /data/ folder
3. Click on: change-requests.json
4. Click: Edit (pencil icon)
5. Replace the content with the file you downloaded: ${filename}
6. Scroll down → Commit changes
7. Message: "Update change requests - ${new Date().toLocaleString()}"
8. Click: Commit

✅ Your app will auto-refresh in 2-3 minutes!

📝 Make sure you:
- Keep the JSON format valid
- Don't modify the structure
- Only replace the content between the [ ] brackets
`;
};
