import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { generateWordDocument } from './utils/wordGenerator';
import { saveToSupabase, loadFromSupabase } from './utils/supabaseService';
import { AVAILABLE_STAKEHOLDERS, USER_NAMES } from './utils/users';

interface Signature {
  userId: string;
  userName: string;
  role: string;
  timestamp: string;
  decision: string;
  feedback: string;
}

interface Impacts {
  timeline: string;
  costs: string;
  knowledge: string;
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
  benefits?: string;
  communicationRequired?: string;
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
      signatures: Signature[];
      requiredSignatories: string[];
    };
    testingValidation?: {
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
  benefits: string;
  communicationRequired: string;
  justificationOfChange: string;
  listOfChanges: string;
  impactedFlow: string;
  impactedFlowVersion: string;
  stakeholders: string[];
  impactTimeline: string;
  impactCosts: string;
  impactKnowledge: string;
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

const PROJECTS: { [key: string]: string } = {
  'Noventum': 'NV',
  'AI Pilot': 'AI',
  'Messaging session': 'MS',
  'Repair center case': 'RC',
  'Knowledge': 'KL',
  'Service contract': 'SC',
};

const PROJECT_LIST = Object.keys(PROJECTS);

const IMPACT_OPTIONS = ['Yes', 'No', 'NA', 'TBD'];

const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const [changeRequests, setChangeRequests] = useState<CR[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [viewMode, setViewMode] = useState<'tableau' | 'kanban'>('tableau');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedCR, setSelectedCR] = useState<CR | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showSignaturePopup, setShowSignaturePopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [crCounters, setCrCounters] = useState<{ [key: string]: number }>({});
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  // --- Online signature (typed name + confirmation checkbox) ---
  const [signatureNameInput, setSignatureNameInput] = useState('');
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);

  // --- Stage-specific editable fields (Implementation / Testing) ---
  const [implDateInput, setImplDateInput] = useState('');
  const [implFlowVersionInput, setImplFlowVersionInput] = useState('');
  const [testDateInput, setTestDateInput] = useState('');
  const [testCommentsInput, setTestCommentsInput] = useState('');

  const [formData, setFormData] = useState<CreateFormData>({
    title: '',
    project: '',
    description: '',
    deploymentDate: '',
    budgetEur: '',
    delayDays: '',
    implementationDesc: '',
    risks: '',
    benefits: '',
    communicationRequired: 'No',
    justificationOfChange: '',
    listOfChanges: '',
    impactedFlow: '',
    impactedFlowVersion: '',
    stakeholders: [],
    impactTimeline: 'TBD',
    impactCosts: 'TBD',
    impactKnowledge: 'TBD',
  });

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);

      const SupabaseData = await loadFromSupabase();
      let loadedCRs: CR[] = [];

      if (SupabaseData && SupabaseData.length > 0) {
        loadedCRs = SupabaseData;
        setChangeRequests(SupabaseData);

        const counters: { [key: string]: number } = {};
        SupabaseData.forEach(cr => {
          const prefix = cr.id.split('-')[1];
          counters[prefix] = Math.max(counters[prefix] || 0, parseInt(cr.id.split('-')[2]) || 0);
        });
        setCrCounters(counters);
      } else {
        const mockCRs: CR[] = [];
        loadedCRs = mockCRs;

        setChangeRequests(mockCRs);

        const counters: { [key: string]: number } = {};
        mockCRs.forEach(cr => {
          const prefix = cr.id.split('-')[1];
          counters[prefix] = Math.max(counters[prefix] || 0, parseInt(cr.id.split('-')[2]) || 0);
        });
        setCrCounters(counters);
      }

      setLoading(false);

      // Deep-link support: ?cr=CC-XX-000 opens that CR directly (useful for
      // notification/email/Slack links pointing straight to a CR pending signature)
      const params = new URLSearchParams(window.location.search);
      const crIdFromUrl = params.get('cr');
      const targetCR = crIdFromUrl ? loadedCRs.find(c => c.id === crIdFromUrl) : null;

      if (targetCR) {
        setSelectedCR(targetCR);
      } else {
        setShowSignaturePopup(true);
      }
    };

    initializeApp();
  }, []);

  // Reset the signature form and stage fields whenever the selected CR changes
  useEffect(() => {
    setSignatureNameInput('');
    setSignatureConfirmed(false);
    setImplDateInput(selectedCR?.implementationDate || '');
    setImplFlowVersionInput(selectedCR?.newFlowVersion || '');
    setTestDateInput(selectedCR?.testDate || '');
    setTestCommentsInput(selectedCR?.testComments || '');
  }, [selectedCR]);

  const generateCRId = (project: string): string => {
    const prefix = PROJECTS[project] || 'GEN';
    const counter = (crCounters[prefix] || 0) + 1;
    setCrCounters(prev => ({
      ...prev,
      [prefix]: counter
    }));
    return `CC-${prefix}-${String(counter).padStart(3, '0')}`;
  };

  // Checks whether a "required signatory" entry refers to the same person as a
  // given username — handles the fact that older records may store either the
  // raw username (e.g. 'kevin.allan') or the display name (e.g. 'Kevin Allan')
  const isSamePerson = (entry: string, username: string): boolean => {
    return entry === username || entry === (USER_NAMES[username] || username);
  };

  const getPendingSigners = (cr: CR, stage: 'awaitingValidation' | 'testingValidation' = 'awaitingValidation'): string[] => {
    const stageData = cr.workflow?.[stage];
    // Fall back to the CR's signatory list if this stage has no explicit
    // requiredSignatories yet (e.g. legacy CRs created before this was tracked)
    const required = (stageData?.requiredSignatories && stageData.requiredSignatories.length > 0)
      ? stageData.requiredSignatories
      : (cr.stakeholders || []);
    const signedUserIds = stageData?.signatures.map((s) => s.userId) || [];
    return required.filter((entry) => !signedUserIds.some((uid) => isSamePerson(entry, uid)));
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

  // Softer, pastel badge colors — same color coding as getStatusColor, less saturated
  const getStatusBadgeStyle = (status: string): { backgroundColor: string; color: string } => {
    switch (status) {
      case 'Draft': return { backgroundColor: '#E5E7EB', color: '#4B5563' };
      case 'Awaiting Validation': return { backgroundColor: '#FEF3C7', color: '#92400E' };
      case 'Approved': return { backgroundColor: '#D1FAE5', color: '#065F46' };
      case 'Implementation': return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
      case 'Testing': return { backgroundColor: '#F3E8FF', color: '#6B21A8' };
      case 'Deployed': return { backgroundColor: '#CFFAFE', color: '#155E75' };
      default: return { backgroundColor: '#E5E7EB', color: '#4B5563' };
    }
  };

  const STEP_ORDER = ['Draft', 'Awaiting Validation', 'Approved', 'Implementation', 'Testing', 'Deployed'];

  // Renders the horizontal step tracker ("chemin de suivi") for a CR's status
  const renderStepper = (cr: CR) => {
    const currentIndex = STEP_ORDER.indexOf(cr.currentStatus);
    return (
      <div className="cr-stepper">
        {STEP_ORDER.map((step, idx) => {
          const state = idx < currentIndex ? 'done' : idx === currentIndex ? 'current' : 'upcoming';
          return (
            <React.Fragment key={step}>
              <div className={`stepper-node ${state}`}>
                <div className="stepper-dot">{state === 'done' ? '✓' : idx + 1}</div>
                <div className="stepper-label">{step}</div>
              </div>
              {idx < STEP_ORDER.length - 1 && <div className={`stepper-line ${idx < currentIndex ? 'done' : ''}`} />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Builds a shareable, direct link to a specific CR
  const getCRUrl = (crId: string): string => {
    return `${window.location.origin}${window.location.pathname}?cr=${crId}`;
  };

  const copyLink = async (crId: string) => {
    const url = getCRUrl(crId);
    try {
      await navigator.clipboard.writeText(url);
      setSuccessMessage('🔗 Link copied to clipboard!');
    } catch (err) {
      window.prompt('Copy this link:', url);
    }
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  // Opens a CR and reflects it in the URL so the view can be bookmarked/shared
  const openCR = (cr: CR) => {
    setSelectedCR(cr);
    window.history.pushState({}, '', `?cr=${cr.id}`);
  };

  // Closes the detail modal and cleans the URL
  const closeCRModal = () => {
    setSelectedCR(null);
    window.history.pushState({}, '', window.location.pathname);
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

  const handleSaveImplementation = async () => {
    if (!selectedCR) return;
    const updated: CR = { ...selectedCR, implementationDate: implDateInput, newFlowVersion: implFlowVersionInput };
    const updatedCRs = changeRequests.map(cr => cr.id === updated.id ? updated : cr);
    setChangeRequests(updatedCRs);
    setSelectedCR(updated);
    logActivity(updated.id, 'UPDATED', 'Updated implementation details');
    setSuccessMessage('✅ Implementation details saved!');
    await saveToSupabase(updatedCRs);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleSaveTesting = async () => {
    if (!selectedCR) return;
    const updated: CR = { ...selectedCR, testDate: testDateInput, testComments: testCommentsInput };
    const updatedCRs = changeRequests.map(cr => cr.id === updated.id ? updated : cr);
    setChangeRequests(updatedCRs);
    setSelectedCR(updated);
    logActivity(updated.id, 'UPDATED', 'Updated testing details');
    setSuccessMessage('✅ Testing details saved!');
    await saveToSupabase(updatedCRs);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleCreateCR = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.project) {
      alert('Title and Project are required!');
      return;
    }

    const newId = generateCRId(formData.project);
    const requesterName = USER_NAMES[currentUser] || currentUser;

    const allStakeholders = [requesterName, ...formData.stakeholders];

    const newCR: CR = {
      id: newId,
      title: formData.title,
      project: formData.project,
      description: formData.description,
      currentStatus: 'Draft',
      progressPercentage: 10,
      requesterName: requesterName,
      dates: {
        created: new Date().toISOString().split('T')[0],
        deploymentPlanned: formData.deploymentDate || null,
      },
      impact: {
        budgetEur: parseInt(formData.budgetEur) || 0,
        delayDays: parseInt(formData.delayDays) || 0,
      },
      impacts: {
        timeline: formData.impactTimeline,
        costs: formData.impactCosts,
        knowledge: formData.impactKnowledge,
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
      benefits: formData.benefits,
      communicationRequired: formData.communicationRequired,
      justificationOfChange: formData.justificationOfChange,
      listOfChanges: formData.listOfChanges,
      impactedFlow: formData.impactedFlow,
      impactedFlowVersion: formData.impactedFlowVersion,
      stakeholders: allStakeholders,
    };

    const updatedCRs = [newCR, ...changeRequests];
    setChangeRequests(updatedCRs);
    logActivity(newCR.id, 'CREATED', `Created CR: ${newCR.title}`);
    setSuccessMessage(`✅ CR ${newCR.id} created successfully!`);

    await saveToSupabase(updatedCRs);

    setFormData({
      title: '',
      project: '',
      description: '',
      deploymentDate: '',
      budgetEur: '',
      delayDays: '',
      implementationDesc: '',
      risks: '',
      benefits: '',
      communicationRequired: 'No',
      justificationOfChange: '',
      listOfChanges: '',
      impactedFlow: '',
      impactedFlowVersion: '',
      stakeholders: [],
      impactTimeline: 'TBD',
      impactCosts: 'TBD',
      impactKnowledge: 'TBD',
    });

    setTimeout(() => {
      setShowCreateModal(false);
      setSuccessMessage('');
    }, 2000);
  };

  const handleSign = async (stage: 'awaitingValidation' | 'testingValidation' = 'awaitingValidation') => {
    if (!selectedCR) return;

    const currentUserName = USER_NAMES[currentUser] || currentUser;

    // Require the user to type their exact full name as an online signature
    if (signatureNameInput.trim().toLowerCase() !== currentUserName.trim().toLowerCase()) {
      alert(`Please type your full name exactly as shown ("${currentUserName}") to sign.`);
      return;
    }

    // Require explicit confirmation
    if (!signatureConfirmed) {
      alert('Please check the confirmation box before signing.');
      return;
    }

    // Initialiser workflow si nécessaire
    if (!selectedCR.workflow) {
      selectedCR.workflow = {};
    }
    if (!selectedCR.workflow[stage]) {
      selectedCR.workflow[stage] = {
        signatures: [],
        requiredSignatories: []
      };
    }

    const stageData = selectedCR.workflow[stage]!;

    // Vérifier si déjà signé
    const alreadySigned = stageData.signatures.some(s => s.userId === currentUser);
    if (alreadySigned) {
      alert('You already signed this CR!');
      return;
    }

    // Ajouter la signature
    const newSignature: Signature = {
      userId: currentUser,
      userName: currentUserName,
      role: 'Manager',
      timestamp: new Date().toISOString(),
      decision: 'APPROVED',
      feedback: ''
    };

    stageData.signatures.push(newSignature);

    // Update l'état
    const updatedCRs = changeRequests.map(cr => cr.id === selectedCR.id ? selectedCR : cr);
    setChangeRequests(updatedCRs);
    setSelectedCR({ ...selectedCR });

    logActivity(selectedCR.id, 'SIGNED', `Signed CR (${stage === 'testingValidation' ? 'Testing' : 'Awaiting Validation'}): ${selectedCR.title}`);
    setSuccessMessage(`✅ ${currentUserName} signed ${selectedCR.id}!`);

    setSignatureNameInput('');
    setSignatureConfirmed(false);

    await saveToSupabase(updatedCRs);

    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleDeleteCR = async (crId: string) => {
    if (window.confirm('Are you sure you want to delete this CR?')) {
      const updatedCRs = changeRequests.filter(cr => cr.id !== crId);
      setChangeRequests(updatedCRs);
      logActivity(crId, 'DELETED', `Deleted CR`);
      closeCRModal();
      setSuccessMessage(`✅ CR ${crId} deleted!`);

      await saveToSupabase(updatedCRs);

      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const handleStatusChange = async (crId: string, newStatus: string) => {
    const updatedCRs = changeRequests.map(cr =>
      cr.id === crId ? { ...cr, currentStatus: newStatus } : cr
    );

    setChangeRequests(updatedCRs);
    logActivity(crId, 'STATUS_CHANGED', `Status changed to: ${newStatus}`);

    if (selectedCR?.id === crId) {
      setSelectedCR({ ...selectedCR, currentStatus: newStatus });
    }

    setEditingStatus(null);
    setSuccessMessage(`✅ Status updated to ${newStatus}!`);

    await saveToSupabase(updatedCRs);

    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const filteredCRs = filterStatus === 'All'
    ? changeRequests
    : changeRequests.filter((cr) => cr.currentStatus === filterStatus);

  const userActivityLogs = auditLogs.filter(log => log.userId === currentUser);

  if (loading) return <div className="dashboard"><p>Loading...</p></div>;

  const currentUserDisplayName = USER_NAMES[currentUser] || currentUser;
  const isPendingSignerOnSelected = selectedCR ? getPendingSigners(selectedCR, 'awaitingValidation').some(entry => isSamePerson(entry, currentUser)) : false;
  const alreadySignedSelected = selectedCR
    ? (selectedCR.workflow?.awaitingValidation?.signatures.some(s => s.userId === currentUser) ?? false)
    : false;
  const isPendingTestSignerOnSelected = selectedCR ? getPendingSigners(selectedCR, 'testingValidation').some(entry => isSamePerson(entry, currentUser)) : false;
  const alreadySignedTestingSelected = selectedCR
    ? (selectedCR.workflow?.testingValidation?.signatures.some(s => s.userId === currentUser) ?? false)
    : false;
  const canSign = signatureNameInput.trim().toLowerCase() === currentUserDisplayName.trim().toLowerCase() && signatureConfirmed;

  return (
    <div className="dashboard">
      {successMessage && (
        <div className="success-banner">
          {successMessage}
        </div>
      )}

      {showSignaturePopup && (
        <div className="modal-overlay" onClick={() => setShowSignaturePopup(false)}>
          <div className="modal-content signature-popup" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Welcome, {currentUserDisplayName}! 👋</h2>
              <button className="btn-close" onClick={() => setShowSignaturePopup(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>You have pending signatures on the following Change Requests:</p>
              <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                {changeRequests
                  .filter(cr => {
                    if (cr.currentStatus !== 'Awaiting Validation') return false;
                    const pending = getPendingSigners(cr, 'awaitingValidation');
                    return pending.some(entry => isSamePerson(entry, currentUser));
                  })
                  .map(cr => (
                    <div
                      key={cr.id}
                      style={{
                        padding: '10px',
                        marginBottom: '8px',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #00b0db',
                        borderRadius: '6px',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#e0f7ff';
                        e.currentTarget.style.borderColor = '#0099c1';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f9ff';
                        e.currentTarget.style.borderColor = '#00b0db';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <a
                          href={getCRUrl(cr.id)}
                          onClick={(e) => {
                            e.preventDefault();
                            openCR(cr);
                            setShowSignaturePopup(false);
                          }}
                          style={{ textDecoration: 'none', cursor: 'pointer', flex: 1 }}
                        >
                          <div style={{ fontWeight: 600, color: '#00b0db', textDecoration: 'underline' }}>{cr.id}</div>
                          <div style={{ fontSize: '14px', color: '#1f2937', marginTop: '4px' }}>
                            {cr.title}
                          </div>
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyLink(cr.id);
                          }}
                          title="Copy direct link to this CR"
                          style={{
                            background: 'none',
                            border: '1px solid #00b0db',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            color: '#00b0db',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          🔗 Copy link
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <p className="signature-hint" style={{ marginTop: '15px' }}>
                Click a CR (or its link) to open it and sign online.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-submit" onClick={() => setShowSignaturePopup(false)}>
                Got it!
              </button>
            </div>
          </div>
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
                const pending = cr.currentStatus === 'Awaiting Validation' ? getPendingSigners(cr, 'awaitingValidation') : [];
                const sigs = cr.workflow?.awaitingValidation?.signatures.length || 0;
                return (
                  <tr key={cr.id} className="cr-row">
                    <td className="id-cell">{cr.id}</td>
                    <td className="title-cell">{cr.title}</td>
                    <td>{cr.project}</td>
                    <td className="date-cell">{cr.dates.created}</td>
                    <td>{cr.requesterName}</td>
                    <td>
                      <div className="status-badge" style={getStatusBadgeStyle(cr.currentStatus)}>
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
                      <button className="btn-detail" onClick={() => openCR(cr)}>
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
                    <div key={cr.id} className="kanban-card" onClick={() => openCR(cr)}>
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
        <div className="modal-overlay" onClick={closeCRModal}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedCR.id}</h2>
                <p className="modal-subtitle">{selectedCR.title}</p>
              </div>
              <button className="btn-close" onClick={closeCRModal}>✕</button>
            </div>

            <div className="modal-body">
              {renderStepper(selectedCR)}

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
                  {editingStatus === selectedCR.id ? (
                    <select
                      value={selectedCR.currentStatus}
                      onChange={(e) => handleStatusChange(selectedCR.id, e.target.value)}
                      autoFocus
                    >
                      <option>Draft</option>
                      <option>Awaiting Validation</option>
                      <option>Approved</option>
                      <option>Implementation</option>
                      <option>Testing</option>
                      <option>Deployed</option>
                    </select>
                  ) : (
                    <div className="status-row">
                      <div className="status-badge" style={{ ...getStatusBadgeStyle(selectedCR.currentStatus), display: 'inline-block' }}>
                        {selectedCR.currentStatus}
                      </div>
                      <button className="btn-edit-status" onClick={() => setEditingStatus(selectedCR.id)}>
                        Change
                      </button>
                    </div>
                  )}
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

              {selectedCR.impacts && (
                <div className="detail-row impacts-section">
                  <label>Impacts</label>
                  <div className="impacts-grid">
                    <div className="impact-item">
                      <span className="impact-label">Timeline:</span>
                      <span className="impact-value">{selectedCR.impacts.timeline}</span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-label">Costs:</span>
                      <span className="impact-value">{selectedCR.impacts.costs}</span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-label">Knowledge:</span>
                      <span className="impact-value">{selectedCR.impacts.knowledge}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedCR.stakeholders && selectedCR.stakeholders.length > 0 && (
                <div className="detail-row">
                  <label>The Signatory</label>
                  <div className="stakeholders-list">
                    {selectedCR.stakeholders.map((stakeholder, idx) => (
                      <span key={idx} className="stakeholder-badge">{stakeholder}</span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedCR.justificationOfChange || selectedCR.listOfChanges || selectedCR.impactedFlow || selectedCR.impactedFlowVersion) && (
                <div className="detail-row">
                  <label>Change Details</label>
                  <div className="change-details-grid">
                    <div className="detail-item">
                      <label>Justification of Change</label>
                      <p>{selectedCR.justificationOfChange || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>List of Changes</label>
                      <p>{selectedCR.listOfChanges || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Impacted Flow</label>
                      <p>{selectedCR.impactedFlow || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Impacted Flow Version</label>
                      <p>{selectedCR.impactedFlowVersion || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedCR.currentStatus !== 'Implementation' && (selectedCR.implementationDate || selectedCR.newFlowVersion) && (
                <div className="detail-row">
                  <label>Implementation Record</label>
                  <p>Date: {selectedCR.implementationDate || 'N/A'} — New Flow Version: {selectedCR.newFlowVersion || 'N/A'}</p>
                </div>
              )}

              {selectedCR.currentStatus !== 'Testing' && (selectedCR.testDate || selectedCR.testComments) && (
                <div className="detail-row">
                  <label>Testing Record</label>
                  <p>Date: {selectedCR.testDate || 'N/A'} — Comments: {selectedCR.testComments || 'N/A'}</p>
                </div>
              )}

              {['Draft', 'Awaiting Validation'].includes(selectedCR.currentStatus) && selectedCR.workflow?.awaitingValidation && (
                <div className="detail-row pending-section">
                  <label>Pending Signatures</label>
                  <div className="pending-list">
                    {getPendingSigners(selectedCR, 'awaitingValidation').length === 0 ? (
                      <p className="all-signed">✅ All signed!</p>
                    ) : (
                      <ul>
                        {getPendingSigners(selectedCR, 'awaitingValidation').map(userId => (
                          <li key={userId}>⏳ {USER_NAMES[userId] || userId}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {['Draft', 'Awaiting Validation'].includes(selectedCR.currentStatus) && selectedCR.workflow?.awaitingValidation?.signatures && selectedCR.workflow.awaitingValidation.signatures.length > 0 && (
                <div className="detail-row">
                  <label>Signed By</label>
                  <div className="signed-list">
                    {selectedCR.workflow.awaitingValidation.signatures.map((sig, idx) => (
                      <span key={idx} className="signed-badge" title={new Date(sig.timestamp).toLocaleString()}>
                        ✅ {sig.userName}
                      </span>
                    ))}
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

              {selectedCR.benefits && (
                <div className="detail-row">
                  <label>Benefits</label>
                  <p>{selectedCR.benefits}</p>
                </div>
              )}

              {selectedCR.risks && (
                <div className="detail-row">
                  <label>Risks</label>
                  <p>{selectedCR.risks}</p>
                </div>
              )}

              <div className="detail-row">
                <label>User Communication Required</label>
                <p>{selectedCR.communicationRequired === 'Yes' ? '✅ Yes' : '⬜ No'}</p>
              </div>

              <div className="progress-section">
                <label>Progress</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${selectedCR.progressPercentage}%` }}></div>
                </div>
                <p className="progress-text">{selectedCR.progressPercentage}% completed</p>
              </div>

              {/* --- Online signature block: only shown to users still awaiting to sign, at the Awaiting Validation stage --- */}
              {selectedCR.currentStatus === 'Awaiting Validation' && isPendingSignerOnSelected && !alreadySignedSelected && (
                <div
                  className="detail-row signature-section"
                  style={{
                    background: '#f0f9ff',
                    border: '1px solid #00b0db',
                    borderRadius: '8px',
                    padding: '15px',
                    marginTop: '15px',
                  }}
                >
                  <label>✍️ Your signature</label>
                  <p style={{ fontSize: '13px', color: '#555', margin: '4px 0 10px' }}>
                    To approve this Change Request, type your full name exactly as shown below and confirm.
                  </p>
                  <input
                    type="text"
                    placeholder={`Type "${currentUserDisplayName}"`}
                    value={signatureNameInput}
                    onChange={(e) => setSignatureNameInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', marginBottom: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={signatureConfirmed}
                      onChange={(e) => setSignatureConfirmed(e.target.checked)}
                      style={{ marginTop: '2px' }}
                    />
                    <span>I confirm I have reviewed this Change Request and I approve it.</span>
                  </label>
                  <button
                    className="btn-sign"
                    onClick={() => handleSign('awaitingValidation')}
                    disabled={!canSign}
                    style={{
                      opacity: canSign ? 1 : 0.5,
                      cursor: canSign ? 'pointer' : 'not-allowed',
                    }}
                  >
                    ✍️ Sign this CR
                  </button>
                </div>
              )}

              {selectedCR.currentStatus === 'Awaiting Validation' && alreadySignedSelected && (
                <p style={{ color: '#4caf50', fontWeight: 600, marginTop: '15px' }}>
                  ✅ You have already signed this CR.
                </p>
              )}

              {/* --- Implementation stage: implementation date + new flow version --- */}
              {selectedCR.currentStatus === 'Implementation' && (
                <div
                  className="detail-row stage-section"
                  style={{ background: '#eff6ff', border: '1px solid #2196f3', borderRadius: '8px', padding: '15px', marginTop: '15px' }}
                >
                  <label>🛠️ Implementation Details</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Implementation Date
                      </label>
                      <input
                        type="date"
                        value={implDateInput}
                        onChange={(e) => setImplDateInput(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        New Flow Version
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. V4"
                        value={implFlowVersionInput}
                        onChange={(e) => setImplFlowVersionInput(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <button className="btn-sign" onClick={handleSaveImplementation}>
                    💾 Save Implementation Details
                  </button>
                </div>
              )}

              {/* --- Testing stage: test date + comments, plus its own signature step --- */}
              {selectedCR.currentStatus === 'Testing' && (
                <div
                  className="detail-row stage-section"
                  style={{ background: '#faf5ff', border: '1px solid #9c27b0', borderRadius: '8px', padding: '15px', marginTop: '15px' }}
                >
                  <label>🧪 Testing Details</label>
                  <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Test Date
                    </label>
                    <input
                      type="date"
                      value={testDateInput}
                      onChange={(e) => setTestDateInput(e.target.value)}
                      style={{ width: '100%', padding: '8px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Comments
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Test results, observations..."
                      value={testCommentsInput}
                      onChange={(e) => setTestCommentsInput(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}
                    />
                  </div>
                  <button className="btn-sign" onClick={handleSaveTesting}>
                    💾 Save Testing Details
                  </button>

                  {getPendingSigners(selectedCR, 'testingValidation').length > 0 && (
                    <div className="pending-list" style={{ marginTop: '15px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Pending Test Sign-off
                      </label>
                      <ul>
                        {getPendingSigners(selectedCR, 'testingValidation').map(userId => (
                          <li key={userId}>⏳ {USER_NAMES[userId] || userId}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {isPendingTestSignerOnSelected && !alreadySignedTestingSelected && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #d8b4fe' }}>
                      <label>✍️ Your signature</label>
                      <p style={{ fontSize: '13px', color: '#555', margin: '4px 0 10px' }}>
                        To sign off on testing for this Change Request, type your full name exactly as shown below and confirm.
                      </p>
                      <input
                        type="text"
                        placeholder={`Type "${currentUserDisplayName}"`}
                        value={signatureNameInput}
                        onChange={(e) => setSignatureNameInput(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', marginBottom: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={signatureConfirmed}
                          onChange={(e) => setSignatureConfirmed(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <span>I confirm I have reviewed the test results and I approve them.</span>
                      </label>
                      <button
                        className="btn-sign"
                        onClick={() => handleSign('testingValidation')}
                        disabled={!canSign}
                        style={{ opacity: canSign ? 1 : 0.5, cursor: canSign ? 'pointer' : 'not-allowed' }}
                      >
                        ✍️ Sign Test Results
                      </button>
                    </div>
                  )}

                  {alreadySignedTestingSelected && (
                    <p style={{ color: '#4caf50', fontWeight: 600, marginTop: '15px' }}>
                      ✅ You have already signed the test results for this CR.
                    </p>
                  )}

                  {selectedCR.workflow?.testingValidation?.signatures && selectedCR.workflow.testingValidation.signatures.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                        Signed By
                      </label>
                      <div className="signed-list">
                        {selectedCR.workflow.testingValidation.signatures.map((sig, idx) => (
                          <span key={idx} className="signed-badge" title={new Date(sig.timestamp).toLocaleString()}>
                            ✅ {sig.userName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-edit">✏️ Edit</button>
                <button
                  className="btn-share"
                  onClick={() => copyLink(selectedCR.id)}
                  title="Copy a direct link to this CR"
                >
                  🔗 Copy link
                </button>
                <button className="btn-download" onClick={() => generateWordDocument(selectedCR)}>
                  📄 Download Word
                </button>
              </div>

              {selectedCR.currentStatus === 'Draft' && (
                <div className="modal-actions danger">
                  <button className="btn-delete" onClick={() => handleDeleteCR(selectedCR.id)}>
                    🗑️ Delete CR
                  </button>
                </div>
              )}
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
                    <label>Justification of Change</label>
                    <textarea
                      name="justificationOfChange"
                      value={formData.justificationOfChange}
                      onChange={handleFormChange}
                      placeholder="Why is this change necessary?"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>List of Changes</label>
                    <textarea
                      name="listOfChanges"
                      value={formData.listOfChanges}
                      onChange={handleFormChange}
                      placeholder="Detail each change to be made..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Impacted Flow</label>
                    <input
                      type="text"
                      name="impactedFlow"
                      value={formData.impactedFlow}
                      onChange={handleFormChange}
                      placeholder="e.g. Screen_Sub_Case_Intake_Core"
                    />
                  </div>
                  <div className="form-group">
                    <label>Impacted Flow Version</label>
                    <input
                      type="text"
                      name="impactedFlowVersion"
                      value={formData.impactedFlowVersion}
                      onChange={handleFormChange}
                      placeholder="e.g. V4"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>Benefits</label>
                    <textarea
                      name="benefits"
                      value={formData.benefits}
                      onChange={handleFormChange}
                      placeholder="Describe the expected benefits of this change..."
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
                  <div className="form-group">
                    <label>User Communication Required?</label>
                    <select
                      name="communicationRequired"
                      value={formData.communicationRequired}
                      onChange={handleFormChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>Impacts</label>
                    <div className="impacts-form-grid">
                      <div className="impact-form-item">
                        <label>Timeline</label>
                        <select name="impactTimeline" value={formData.impactTimeline} onChange={handleFormChange}>
                          {IMPACT_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="impact-form-item">
                        <label>Costs</label>
                        <select name="impactCosts" value={formData.impactCosts} onChange={handleFormChange}>
                          {IMPACT_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="impact-form-item">
                        <label>Knowledge</label>
                        <select name="impactKnowledge" value={formData.impactKnowledge} onChange={handleFormChange}>
                          {IMPACT_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full">
                    <label>The Signatory (Requester auto-added)</label>
                    <div className="stakeholder-list">
                      {AVAILABLE_STAKEHOLDERS.filter(u => u !== currentUser).map(stakeholder => (
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
