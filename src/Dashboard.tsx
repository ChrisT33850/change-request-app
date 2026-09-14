import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface Signature {
  userId: string;
  userName: string;
  role: string;
  timestamp: string;
  decision: string;
  feedback: string;
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
  implementation?: {
    description: string;
    technicalOwner: string;
  };
  tests?: {
    report: string;
    status: string;
  };
  risks?: string;
  workflow?: {
    awaitingValidation?: {
      signatures: Signature[];
      requiredSignatories: string[];
    };
  };
}

interface CreateFormData {
  title: string;
  project: string;
  description: string;
  deploymentDate: string;
  budgetEur: string;
  delayDays: string;
  implementationDesc: string;
  risks: string;
  stakeholders: string[];
}

interface DashboardProps {
  currentUser: string;
}

const AVAILABLE_STAKEHOLDERS = [
  'marie.dupont',
  'jean.bernard',
  'pierre.leclerc',
  'qa.team',
  'user.acceptance',
];

const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const [changeRequests, setChangeRequests] = useState<CR[]>([]);
  const [viewMode, setViewMode] = useState<'tableau' | 'kanban'>('tableau');
  const [filterStatus, setFilterStatus] = useState('Tous');
  const [selectedCR, setSelectedCR] = useState<CR | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState<CreateFormData>({
    title: '',
    project: '',
    description: '',
    deploymentDate: '',
    budgetEur: '',
    delayDays: '',
    implementationDesc: '',
    risks: '',
    stakeholders: [],
  });

  useEffect(() => {
    const mockCRs: CR[] = [
      {
        id: 'CC-2026-0005',
        title: 'Réalisé M3 Octobre',
        project: 'Modernisation Infrastructure',
        description: 'Migration base de données vers Azure avec tests de performance et documentation complète.',
        currentStatus: 'En Attente de validation',
        progressPercentage: 25,
        requesterName: 'Christophe Trevise',
        dates: { created: '2026-10-10', deploymentPlanned: '2026-10-20' },
        impact: { budgetEur: 50000, delayDays: 7 },
        implementation: { description: 'Plan de migration vers Azure...', technicalOwner: 'Jean Bernard' },
        tests: { report: 'Tests en cours - Performance +40%', status: 'IN_PROGRESS' },
        risks: 'Risque de downtime <5 min',
        workflow: {
          awaitingValidation: {
            signatures: [
              { userId: 'marie.dupont', userName: 'Marie Dupont', role: 'IT Manager', timestamp: '2026-10-11T10:00:00Z', decision: 'APPROVED', feedback: 'Approuvé' },
              { userId: 'jean.bernard', userName: 'Jean Bernard', role: 'Ops Manager', timestamp: '2026-10-11T11:30:00Z', decision: 'APPROVED', feedback: '' },
            ],
            requiredSignatories: ['marie.dupont', 'jean.bernard', 'pierre.leclerc'],
          },
        },
      },
      {
        id: 'CC-2026-0006',
        title: 'Migration SSL Certificates',
        project: 'Infrastructure Sécurité',
        description: 'Mise à jour des certificats SSL pour tous les serveurs de production.',
        currentStatus: 'Approuvé',
        progressPercentage: 50,
        requesterName: 'Marie Dupont',
        dates: { created: '2026-09-11', deploymentPlanned: '2026-09-15' },
        impact: { budgetEur: 5000, delayDays: 1 },
        implementation: { description: 'Renouvellement SSL...', technicalOwner: 'Jean Bernard' },
        tests: { report: 'Tests complétés', status: 'PASSED' },
        risks: 'Downtime minimal',
      },
      {
        id: 'CC-2026-0004',
        title: 'Change Management System',
        project: 'DevOps',
        description: 'Implémentation d\'une nouvelle procédure de gestion des changements.',
        currentStatus: 'Déployé',
        progressPercentage: 100,
        requesterName: 'Jean Bernard',
        dates: { created: '2026-09-07', deploymentPlanned: '2026-09-10' },
        impact: { budgetEur: 25000, delayDays: 3 },
        implementation: { description: 'Déploiement complet...', technicalOwner: 'Jean Bernard' },
        tests: { report: 'Tous les tests passés', status: 'PASSED' },
        risks: 'Aucun majeur',
      },
    ];
    setChangeRequests(mockCRs);
    setLoading(false);
  }, []);

  const getPendingSigners = (cr: CR): string[] => {
    const awaitingVal = cr.workflow?.awaitingValidation;
    if (!awaitingVal) return [];
    const signed = awaitingVal.signatures.map((s) => s.userId);
    return awaitingVal.requiredSignatories.filter((r) => !signed.includes(r));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Brouillon': return '#999';
      case 'En Attente de validation': return '#ff9800';
      case 'Approuvé': return '#4caf50';
      case 'Implementation en cours': return '#2196f3';
      case 'En tests': return '#9c27b0';
      case 'Déployé': return '#00bcd4';
      default: return '#999';
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStakeholderToggle = (stakeholder: string) => {
    setFormData(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.includes(stakeholder)
        ? prev.stakeholders.filter(s => s !== stakeholder)
        : [...prev.stakeholders, stakeholder]
    }));
  };

  const handleCreateCR = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.project) {
      alert('Titre et Projet sont obligatoires!');
      return;
    }

    const newCR: CR = {
      id: `CC-2026-${Math.floor(Math.random() * 10000)}`,
      title: formData.title,
      project: formData.project,
      description: formData.description,
      currentStatus: 'Brouillon',
      progressPercentage: 10,
      requesterName: currentUser,
      dates: {
        created: new Date().toISOString().split('T')[0],
        deploymentPlanned: formData.deploymentDate || null,
      },
      impact: {
        budgetEur: parseInt(formData.budgetEur) || 0,
        delayDays: parseInt(formData.delayDays) || 0,
      },
      implementation: {
        description: formData.implementationDesc,
        technicalOwner: '',
      },
      tests: {
        report: '',
        status: 'PENDING',
      },
      risks: formData.risks,
    };

    setChangeRequests(prev => [newCR, ...prev]);
    setSuccessMessage(`✅ CR ${newCR.id} créée avec succès!`);
    
    setFormData({
      title: '',
      project: '',
      description: '',
      deploymentDate: '',
      budgetEur: '',
      delayDays: '',
      implementationDesc: '',
      risks: '',
      stakeholders: [],
    });

    setTimeout(() => {
      setShowCreateModal(false);
      setSuccessMessage('');
    }, 2000);
  };

  const filteredCRs = filterStatus === 'Tous'
    ? changeRequests
    : changeRequests.filter((cr) => cr.currentStatus === filterStatus);

  if (loading) return <div className="dashboard"><p>Chargement...</p></div>;

  return (
    <div className="dashboard">
      {successMessage && (
        <div className="success-banner">
          {successMessage}
        </div>
      )}

      <div className="top-bar">
        <div className="left-section">
          <div className="filter-group">
            <label>Filtrer par statut:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option>Tous</option>
              <option>Brouillon</option>
              <option>En Attente de validation</option>
              <option>Approuvé</option>
              <option>Implementation en cours</option>
              <option>En tests</option>
              <option>Déployé</option>
            </select>
          </div>
        </div>

        <div className="right-section">
          <button className="btn-create" onClick={() => setShowCreateModal(true)}>
            ➕ Créer une CR
          </button>
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'tableau' ? 'active' : ''}`} onClick={() => setViewMode('tableau')}>
              📊 Tableau
            </button>
            <button className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>
              📋 Kanban
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'tableau' ? (
        <div className="tableau-view">
          <table className="cr-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Projet</th>
                <th>Demandeur</th>
                <th>Statut</th>
                <th>Signatures</th>
                <th>Budget</th>
                <th>Délai</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCRs.map((cr) => {
                const pending = getPendingSigners(cr);
                const sigs = cr.workflow?.awaitingValidation?.signatures.length || 0;
                return (
                  <tr key={cr.id} className="cr-row">
                    <td className="id-cell">{cr.id}</td>
                    <td className="title-cell">{cr.title}</td>
                    <td>{cr.project}</td>
                    <td>{cr.requesterName}</td>
                    <td>
                      <div className="status-badge" style={{ backgroundColor: getStatusColor(cr.currentStatus) }}>
                        {cr.currentStatus}
                      </div>
                    </td>
                    <td className="sig-cell">
                      <span className="sig-done">✓ {sigs}</span>
                      {pending.length > 0 && <span className="sig-pending">⏳ {pending.length}</span>}
                    </td>
                    <td>€{(cr.impact.budgetEur / 1000).toFixed(0)}k</td>
                    <td>{cr.impact.delayDays}j</td>
                    <td className="actions-cell">
                      <button className="btn-detail" onClick={() => setSelectedCR(cr)}>
                        Voir détails
                      </button>
                    </td>
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
                <div className="column-header" style={{ borderTopColor: getStatusColor(status) }}>
                  <h3>{status}</h3>
                  <span className="count">{statusCRs.length}</span>
                </div>
                <div className="column-cards">
                  {statusCRs.map((cr) => (
                    <div key={cr.id} className="kanban-card" onClick={() => setSelectedCR(cr)}>
                      <div className="card-header">
                        <span className="card-id">{cr.id}</span>
                      </div>
                      <p className="card-title">{cr.title}</p>
                      <div className="card-footer">
                        <span>€{(cr.impact.budgetEur / 1000).toFixed(0)}k</span>
                        <span>{cr.impact.delayDays}j</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCR && (
        <div className="modal-overlay" onClick={() => setSelectedCR(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedCR.id}</h2>
                <p className="modal-subtitle">{selectedCR.title}</p>
              </div>
              <button className="btn-close" onClick={() => setSelectedCR(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <label>Projet</label>
                <p>{selectedCR.project}</p>
              </div>

              <div className="detail-row">
                <label>Description</label>
                <p>{selectedCR.description}</p>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <label>Demandeur</label>
                  <p>{selectedCR.requesterName}</p>
                </div>
                <div className="detail-item">
                  <label>Statut</label>
                  <div className="status-badge" style={{ backgroundColor: getStatusColor(selectedCR.currentStatus), display: 'inline-block' }}>
                    {selectedCR.currentStatus}
                  </div>
                </div>
                <div className="detail-item">
                  <label>Budget</label>
                  <p>€{selectedCR.impact.budgetEur.toLocaleString()}</p>
                </div>
                <div className="detail-item">
                  <label>Délai</label>
                  <p>{selectedCR.impact.delayDays} jours</p>
                </div>
              </div>

              {selectedCR.implementation && (
                <div className="detail-row">
                  <label>Implementation</label>
                  <p>{selectedCR.implementation.description}</p>
                </div>
              )}

              {selectedCR.tests && (
                <div className="detail-row">
                  <label>Tests</label>
                  <p>{selectedCR.tests.report}</p>
                </div>
              )}

              {selectedCR.risks && (
                <div className="detail-row">
                  <label>Risques</label>
                  <p>{selectedCR.risks}</p>
                </div>
              )}

              <div className="progress-section">
                <label>Progression</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${selectedCR.progressPercentage}%` }}></div>
                </div>
                <p className="progress-text">{selectedCR.progressPercentage}% complété</p>
              </div>

              <div className="modal-actions">
                <button className="btn-edit">✏️ Modifier</button>
                <button className="btn-sign">✍️ Signer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Créer une nouvelle CR</h2>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCR} className="create-form">
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group full">
                    <label>Titre *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="Ex: Migration base de données"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Projet *</label>
                    <input
                      type="text"
                      name="project"
                      value={formData.project}
                      onChange={handleFormChange}
                      placeholder="Ex: Infrastructure"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date déploiement souhaitée</label>
                    <input
                      type="date"
                      name="deploymentDate"
                      value={formData.deploymentDate}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Budget (€)</label>
                    <input
                      type="number"
                      name="budgetEur"
                      value={formData.budgetEur}
                      onChange={handleFormChange}
                      placeholder="50000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Délai (jours)</label>
                    <input
                      type="number"
                      name="delayDays"
                      value={formData.delayDays}
                      onChange={handleFormChange}
                      placeholder="7"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      placeholder="Description détaillée du changement..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>Plan d'implementation</label>
                    <textarea
                      name="implementationDesc"
                      value={formData.implementationDesc}
                      onChange={handleFormChange}
                      placeholder="Détails du plan d'implementation..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>Risques</label>
                    <textarea
                      name="risks"
                      value={formData.risks}
                      onChange={handleFormChange}
                      placeholder="Identifiez les risques potentiels..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>Personnes impliquées (stakeholders)</label>
                    <div className="stakeholder-list">
                      {AVAILABLE_STAKEHOLDERS.map(stakeholder => (
                        <label key={stakeholder} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.stakeholders.includes(stakeholder)}
                            onChange={() => handleStakeholderToggle(stakeholder)}
                          />
                          {stakeholder}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-submit">
                  ✅ Créer la CR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
