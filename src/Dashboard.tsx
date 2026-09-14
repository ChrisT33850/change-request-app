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
      case 'Déployé': return 'badge-deployed';
      default: return '';
    }
  };

  const filteredCRs = filterStatus === 'Tous'
    ? changeRequests
    : changeRequests.filter((cr) => cr.currentStatus === filterStatus);

  if (loading) return <div className="dashboard"><p>Chargement...</p></div>;

  return (
    <div className="dashboard">
      <div className="controls">
        <div className="filter-group">
          <label>Filtrer:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option>Tous les statuts</option>
            <option>Brouillon</option>
            <option>En Attente de validation</option>
            <option>Approuvé</option>
            <option>Implementation en cours</option>
            <option>En tests</option>
            <option>Déployé</option>
          </select>
        </div>
        <div className="view-toggle">
          <button className={`toggle-btn ${viewMode === 'tableau' ? 'active' : ''}`} onClick={() => setViewMode('tableau')}>
            📊 Tableau
          </button>
          <button className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>
            📋 Kanban
          </button>
        </div>
      </div>

      {viewMode === 'tableau' ? (
        <div className="tableau-view">
          <table className="cr-table">
            <thead>
              <tr>
                <th>ID</th><th>Titre</th><th>Projet</th><th>Demandeur</th><th>Statut</th>
                <th>Signatures</th><th>Budget / Délai</th><th>Dates</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCRs.map((cr) => {
                const pending = getPendingSigners(cr);
                const sigs = cr.workflow.awaitingValidation?.signatures.length || 0;
                return (
                  <tr key={cr.id}>
                    <td className="id-cell">{cr.id}</td>
                    <td>{cr.title}</td><td>{cr.project}</td><td>{cr.requesterName}</td>
                    <td><span className={`badge ${getStatusBadgeClass(cr.currentStatus)}`}>{cr.currentStatus}</span></td>
                    <td>✓ {sigs} {pending.length > 0 && `⏳ ${pending.length}`}</td>
                    <td>€{(cr.impact.budgetEur/1000).toFixed(0)}k / {cr.impact.delayDays}j</td>
                    <td>{cr.dates.created} {cr.dates.deploymentPlanned && `→ ${cr.dates.deploymentPlanned}`}</td>
                    <td><button className="btn-view" onClick={() => setSelectedCR(cr)}>Voir</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="kanban-view">
          {['Brouillon', 'En Attente de validation', 'Approuvé', 'Implementation en cours', 'En tests', 'Déployé'].map((status) => {
            const statusCRs = changeRequests.filter((cr) => cr.currentStatus === status);
            return (
              <div key={status} className="kanban-column">
                <div className="column-header"><h3>{status}</h3><span>{statusCRs.length}</span></div>
                <div className="column-cards">
                  {statusCRs.map((cr) => (
                    <div key={cr.id} className="kanban-card" onClick={() => setSelectedCR(cr)}>
                      <p className="card-title">{cr.title}</p>
                      <p className="card-id">{cr.id}</p>
                      <div className="card-meta"><span>€{(cr.impact.budgetEur/1000).toFixed(0)}k</span><span>{cr.impact.delayDays}j</span></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCR && (
        <div className="detail-modal" onClick={() => setSelectedCR(null)}>
          <div className="detail-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedCR(null)}>✕</button>
            <h2>{selectedCR.id} - {selectedCR.title}</h2>
            <div className="detail-body">
              <p>{selectedCR.description}</p>
              <div style={{marginTop: '16px'}}>
                <p><strong>Demandeur:</strong> {selectedCR.requesterName}</p>
                <p><strong>Budget:</strong> €{selectedCR.impact.budgetEur.toLocaleString()} / {selectedCR.impact.delayDays}j</p>
                <p><strong>Dates:</strong> {selectedCR.dates.created} → {selectedCR.dates.deploymentPlanned}</p>
              </div>
              <div className="progress-bar" style={{marginTop: '16px'}}>
                <div className="progress-fill" style={{width: `${selectedCR.progressPercentage}%`}}></div>
              </div>
              <p>{selectedCR.progressPercentage}% complété</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
