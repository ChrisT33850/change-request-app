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

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  crId: string;
  details: string;
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

const PROJECTS: { [key: string]: string } = {
  'Noventum': 'NV',
  'Messaging session': 'Ms',
  'Repair center case': 'RC',
  'Knowledge': 'KL',
  'Service contract': 'SC',
  };

const PROJECT_LIST = Object.keys(PROJECTS);

const USER_NAMES: { [key: string]: string } = {
  'christophe': 'Christophe Trevise',
  'marie.dupont': 'Marie Dupont',
  'jean.bernard': 'Jean Bernard',
  'pierre.leclerc': 'Pierre Leclerc',
  'qa.team': 'QA Team',
  'user.acceptance': 'User Acceptance',
};

const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const [changeRequests, setChangeRequests] = useState<CR[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [viewMode, setViewMode] = useState<'tableau' | 'kanban'>('tableau');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedCR, setSelectedCR] = useState<CR | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [crCounters, setCrCounters] = useState<{ [key: string]: number }>({});

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
        id: 'CC-INFRA-001',
        title: 'Réalisé M3 Octobre',
        project: 'Modernisation Infrastructure',
        description: 'Migration base de données vers Azure avec tests de performance et documentation complète.',
        currentStatus: 'Awaiting Validation',
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
        id: 'CC-SEC-001',
        title: 'Migration SSL Certificates',
        project: 'Infrastructure Sécurité',
        description: 'Mise à jour des certificats SSL pour tous les serveurs de production.',
        currentStatus: 'Approved',
        progressPercentage: 50,
        requesterName: 'Marie Dupont',
        dates: { created: '2026-09-11', deploymentPlanned: '2026-09-15' },
        impact: { budgetEur: 5000, delayDays: 1 },
        implementation: { description: 'Renouvellement SSL...', technicalOwner: 'Jean Bernard' },
        tests: { report: 'Tests complétés', status: 'PASSED' },
        risks: 'Downtime minimal',
      },
      {
        id: 'CC-DEVOPS-001',
        title: 'Change Management System',
        project: 'DevOps',
        description: 'Implémentation d\'une nouvelle procédure de gestion des changements.',
        currentStatus: 'Deployed',
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
    
    // Initialiser les compteurs
    const counters: { [key: string]: number } = {};
    mockCRs.forEach(cr => {
      const prefix = cr.id.split('-')[1];
      counters[prefix] = Math.max(counters[prefix] || 0, parseInt(cr.id.split('-')[2]) || 0);
    });
    setCrCounters(counters);
    
    setLoading(false);
  }, []);

  const generateCRId = (project: string): string => {
    const prefix = PROJECTS[project] || 'GEN';
    const counter = (crCounters[prefix] || 0) + 1;
    setCrCounters(prev => ({
      ...prev,
      [prefix]: counter
    }));
    return `CC-${prefix}-${String(counter).padStart(3, '0')}`;
  };

  const getPendingSigners = (cr: CR): string[] => {
    const awaitingVal = cr.workflow?.awaitingValidation;
    if (!awaitingVal) return [];
    const signed = awaitingVal.signatures.map((s) => s.userId);
    return awaitingVal.requiredSignatories.filter((r) => !signed.includes(r));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return '#999';
      case 'Awaiting Validation': return '#ff9800';
      case 'Approved': return '#4caf50';
      case 'Implementation': return '#2196f3';
      case 'Testing': return '#9c27b0';
      case 'Deployed': return '#00bcd4';
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

  const logActivity = (crId: string, action: string, details: string) => {
    const log: AuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser,
      userName: USER_NAMES[currentUser] || currentUser,
      action,
      crId,
      details,
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleCreateCR = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.project) {
      alert('Title and Project are required!');
      return;
    }

    const newId = generateCRId(formData.project);
    const newCR: CR = {
      id: newId,
      title: formData.title,
      project: formData.project,
      description: formData.description,
      currentStatus: 'Draft',
      progressPercentage: 10,
      requesterName: USER_NAMES[currentUser] || currentUser,
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
    logActivity(newCR.id, 'CREATED', `Created CR: ${newCR.title}`);
    setSuccessMessage(`✅ CR ${newCR.id} created successfully!`);
    
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

  const handleSign = () => {
    if (!selectedCR) return;
    
    logActivity(selectedCR.id, 'SIGNED', `Signed CR: ${selectedCR.title}`);
    setSuccessMessage(`✅ ${USER_NAMES[currentUser] || currentUser} signed ${selectedCR.id}!`);
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const filteredCRs = filterStatus === 'All'
    ? changeRequests
    : changeRequests.filter((cr) => cr.currentStatus === filterStatus);

  const userActivityLogs = auditLogs.filter(log => log.userId === currentUser);

  if (loading) return <div className="dashboard"><p>Loading...</p></div>;

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
            <label>Filter by status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option>All</option>
              <option>Draft</option>
              <option>Awaiting Validation</option>
              <option>Approved</option>
              <option>Implementation</option>
              <option>Testing</option>
              <option>Deployed</option>
            </select>
          </div>
        </div>

        <div className="right-section">
          <button className="btn-activity" onClick={() => setShowActivityModal(true)}>
            📋 My Activity ({userActivityLogs.length})
          </button>
          <button className="btn-create" onClick={() => setShowCreateModal(true)}>
            Create CR
          </button>
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'tableau' ? 'active' : ''}`} onClick={() => setViewMode('tableau')}>
              📊 Table
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
                <th>Title</th>
                <th>Project</th>
                <th>Created</th>
                <th>Requester</th>
                <th>Status</th>
                <th>Signatures</th>
                <th>Budget</th>
                <th>Days</th>
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
                    <td className="date-cell">{cr.dates.created}</td>
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
                    <td>{cr.impact.delayDays}d</td>
                    <td className="actions-cell">
                      <button className="btn-detail" onClick={() => setSelectedCR(cr)}>
                        Details
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
          {['Draft', 'Awaiting Validation', 'Approved', 'Implementation', 'Testing', 'Deployed'].map((status) => {
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
                        <span>{cr.impact.delayDays}d</span>
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
                <label>Project</label>
                <p>{selectedCR.project}</p>
              </div>

              <div className="detail-row">
                <label>Description</label>
                <p>{selectedCR.description}</p>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <label>Requester</label>
                  <p>{selectedCR.requesterName}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <div className="status-badge" style={{ backgroundColor: getStatusColor(selectedCR.currentStatus), display: 'inline-block' }}>
                    {selectedCR.currentStatus}
                  </div>
                </div>
                <div className="detail-item">
                  <label>Budget</label>
                  <p>€{selectedCR.impact.budgetEur.toLocaleString()}</p>
                </div>
                <div className="detail-item">
                  <label>Days</label>
                  <p>{selectedCR.impact.delayDays} days</p>
                </div>
              </div>

              {selectedCR.workflow?.awaitingValidation && (
                <div className="detail-row pending-section">
                  <label>Pending Signatures</label>
                  <div className="pending-list">
                    {getPendingSigners(selectedCR).length === 0 ? (
                      <p className="all-signed">✅ All signed!</p>
                    ) : (
                      <ul>
                        {getPendingSigners(selectedCR).map(userId => (
                          <li key={userId}>⏳ {USER_NAMES[userId] || userId}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

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
                  <label>Risks</label>
                  <p>{selectedCR.risks}</p>
                </div>
              )}

              <div className="progress-section">
                <label>Progress</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${selectedCR.progressPercentage}%` }}></div>
                </div>
                <p className="progress-text">{selectedCR.progressPercentage}% completed</p>
              </div>

              <div className="modal-actions">
                <button className="btn-edit">✏️ Edit</button>
                <button className="btn-sign" onClick={handleSign}>✍️ Sign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showActivityModal && (
        <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
          <div className="modal-content activity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>My Activity</h2>
              <button className="btn-close" onClick={() => setShowActivityModal(false)}>✕</button>
            </div>

            <div className="modal-body activity-body">
              {userActivityLogs.length === 0 ? (
                <p className="no-activity">No activity yet</p>
              ) : (
                <div className="activity-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>CR ID</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userActivityLogs.map(log => (
                        <tr key={log.id}>
                          <td className="activity-time">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="activity-action">{log.action}</td>
                          <td className="activity-cr">{log.crId}</td>
                          <td className="activity-detail">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Change Request</h2>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCR} className="create-form">
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group full">
                    <label>Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="Ex: Database migration"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Project *</label>
                    <select
                      name="project"
                      value={formData.project}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select a project</option>
                      {PROJECT_LIST.map(proj => (
                        <option key={proj} value={proj}>{proj}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Deployment Date</label>
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
                    <label>Days</label>
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
                      placeholder="Detailed description of the change..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>Implementation Plan</label>
                    <textarea
                      name="implementationDesc"
                      value={formData.implementationDesc}
                      onChange={handleFormChange}
                      placeholder="Implementation details..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>Risks</label>
                    <textarea
                      name="risks"
                      value={formData.risks}
                      onChange={handleFormChange}
                      placeholder="Identify potential risks..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>Stakeholders</label>
                    <div className="stakeholder-list">
                      {AVAILABLE_STAKEHOLDERS.map(stakeholder => (
                        <label key={stakeholder} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.stakeholders.includes(stakeholder)}
                            onChange={() => handleStakeholderToggle(stakeholder)}
                          />
                          {USER_NAMES[stakeholder] || stakeholder}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create CR
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
