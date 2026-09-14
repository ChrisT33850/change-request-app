import React, { useState, useEffect } from 'react';
import './Dashboard.css';

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
  workflow: {
    awaitingValidation?: {
      signatures: Array<{userId: string; userName: string; decision: string}>;
      requiredSignatories: string[];
    };
  };
}

interface DashboardProps {
  currentUser: string;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const [changeRequests, setChangeRequests] = useState<CR[]>([]);
  const [viewMode, setViewMode] = useState<'tableau' | 'kanban'>('tableau');
  const [filterStatus, setFilterStatus] = useState('Tous');
  const [selectedCR, setSelectedCR] = useState<CR | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockCRs: CR[] = [
      {
        id: 'CC-2026-0005',
        title: 'Réalisé M3 Octobre',
        project: 'Modernisation Infrastructure',
        description: 'Migration base de données vers Azure.',
        currentStatus: 'En Attente de validation',
        progressPercentage: 25,
        requesterName: 'Christophe Trevise',
        dates: { created: '2026-10-10', deploymentPlanned: '2026-10-20' },
        impact: { budgetEur: 50000, delayDays: 7 },
        workflow: {
          awaitingValidation: {
            signatures: [
              { userId: 'marie.dupont', userName: 'Marie Dupont', decision: 'APPROVED' },
              { userId: 'jean.bernard', userName: 'Jean Bernard', decision: 'APPROVED' },
            ],
            requiredSignatories: ['marie.dupont', 'jean.bernard', 'pierre.leclerc'],
          },
        },
      },
      {
        id: 'CC-2026-0006',
        title: 'Migration SSL Certificates',
        project: 'Infrastructure Sécurité',
        description: 'Mise à jour des certificats SSL.',
        currentStatus: 'Approuvé',
        progressPercentage: 50,
        requesterName: 'Marie Dupont',
        dates: { created: '2026-09-11', deploymentPlanned: '2026-09-15' },
        impact: { budgetEur: 5000, delayDays: 1 },
        workflow: {
          awaitingValidation: {
            signatures: [
              { userId: 'marie.dupont', userName: 'Marie Dupont', decision: 'APPROVED' },
              { userId: 'jean.bernard', userName: 'Jean Bernard', decision: 'APPROVED' },
            ],
            requiredSignatories: ['marie.dupont', 'jean.bernard'],
          },
        },
      },
      {
        id: 'CC-2026-0004',
        title: 'Change Management System',
        project: 'DevOps',
        description: 'Implémentation nouvelle procédure.',
        currentStatus: 'Déployé',
        progressPercentage: 100,
        requesterName: 'Jean Bernard',
        dates: { created: '2026-09-07', deploymentPlanned: '2026-09-10' },
        impact: { budgetEur: 25000, delayDays: 3 },
        workflow: {
          awaitingValidation: {
            signatures: [
              { userId: 'christophe', userName: 'Christophe Trevise', decision: 'APPROVED' },
              { userId: 'marie.dupont', userName: 'Marie Dupont', decision: 'APPROVED' },
              { userId: 'jean.bernard', userName: 'Jean Bernard', decision: 'APPROVED' },
            ],
            requiredSignatories: ['christophe', 'marie.dupont', 'jean.bernard'],
          },
        },
      },
    ];
    setChangeRequests(mockCRs);
    setLoading(false);
  }, []);

  const getPendingSigners = (cr: CR): string[] => {
    const awaitingVal = cr.workflow.awaitingValidation;
    if (!awaitingVal) return [];
    const signed = awaitingVal.signatures.map((s) => s.userId);
    return awaitingVal.requiredSignatories.filter((r) => !signed.includes(r));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Brouillon': return 'badge-draft';
      case 'En Attente de validation': return 'badge-awaiting';
      case 'Approuvé': return 'badge-approved';
      case 'Implementation en cours': return 'badge-impl';
      case 'En tests': return 'badge-testing';
