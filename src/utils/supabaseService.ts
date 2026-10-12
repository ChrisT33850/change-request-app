import { supabase } from ‘./supabaseClient’;

export interface ImpactedFlowEntry {
flow: string;
version: string;
}

export interface CR {
id: string;
title: string;
project: string;
description: string;
currentStatus: string;
requesterName: string;
dates: { created: string; deploymentPlanned: string | null };
impact: { budgetEur: number; delayDays: number };
impacts?: any;
implementation?: any;
tests?: any;
risks?: string;
benefits?: string;
communicationRequired?: string;
justificationOfChange?: string;
listOfChanges?: string;
impactedFlow?: string;
impactedFlowVersion?: string;
impactedFlows?: ImpactedFlowEntry[];
implementationDate?: string;
newFlowVersion?: string;
testDate?: string;
testComments?: string;
stakeholders?: string[];
workflow?: any;
}

const toRow = (cr: CR) => ({
id: cr.id,
title: cr.title,
project: cr.project,
description: cr.description,
current_status: cr.currentStatus,
requester_name: cr.requesterName,
created_at: cr.dates.created,
deployment_planned: cr.dates.deploymentPlanned,
budget_eur: cr.impact.budgetEur,
delay_days: cr.impact.delayDays,
impacts: cr.impacts,
implementation: cr.implementation,
tests: cr.tests,
risks: cr.risks,
stakeholders: cr.stakeholders,
workflow: cr.workflow,
extra: {
benefits: cr.benefits ?? ‘’,
communicationRequired: cr.communicationRequired ?? ‘No’,
justificationOfChange: cr.justificationOfChange ?? ‘’,
listOfChanges: cr.listOfChanges ?? ‘’,
impactedFlows: cr.impactedFlows ?? [],
implementationDate: cr.implementationDate ?? ‘’,
newFlowVersion: cr.newFlowVersion ?? ‘’,
testDate: cr.testDate ?? ‘’,
testComments: cr.testComments ?? ‘’,
},
});

const fromRow = (row: any): CR => {
const extra = row.extra || {};
return {
id: row.id,
title: row.title,
project: row.project,
description: row.description,
currentStatus: row.current_status,
requesterName: row.requester_name,
dates: { created: row.created_at, deploymentPlanned: row.deployment_planned },
impact: { budgetEur: row.budget_eur, delayDays: row.delay_days },
impacts: row.impacts,
implementation: row.implementation,
tests: row.tests,
risks: row.risks,
stakeholders: row.stakeholders,
workflow: row.workflow,
benefits: extra.benefits,
communicationRequired: extra.communicationRequired,
justificationOfChange: extra.justificationOfChange,
listOfChanges: extra.listOfChanges,
impactedFlow: extra.impactedFlow,
impactedFlowVersion: extra.impactedFlowVersion,
impactedFlows: extra.impactedFlows && extra.impactedFlows.length > 0
? extra.impactedFlows
: (extra.impactedFlow ? [{ flow: extra.impactedFlow, version: extra.impactedFlowVersion || ‘’ }] : []),
implementationDate: extra.implementationDate,
newFlowVersion: extra.newFlowVersion,
testDate: extra.testDate,
testComments: extra.testComments,
};
};

export const saveCR = async (cr: CR): Promise<boolean> => {
try {
const { error } = await supabase
.from(‘change_requests’)
.upsert(toRow(cr), { onConflict: ‘id’ });

if (error) {
  console.error('Save CR error:', error);
  return false;
}
return true;

} catch (error) {
console.error(‘Error saving CR:’, error);
return false;
}
};

export const deleteCRById = async (id: string): Promise<boolean> => {
try {
const { error } = await supabase.from(‘change_requests’).delete().eq(‘id’, id);

if (error) {
  console.error('Delete CR error:', error);
  return false;
}
return true;

} catch (error) {
console.error(‘Error deleting CR:’, error);
return false;
}
};

export const loadCRById = async (id: string): Promise<CR | null> => {
try {
const { data, error } = await supabase
.from(‘change_requests’)
.select(‘*’)
.eq(‘id’, id)
.maybeSingle();

if (error || !data) {
  if (error) console.error('Load CR error:', error);
  return null;
}
return fromRow(data);

} catch (error) {
console.error(‘Error loading CR:’, error);
return null;
}
};

export const loadFromSupabase = async (): Promise<CR[] | null> => {
try {
const { data, error } = await supabase
.from(‘change_requests’)
.select(‘*’)
.order(‘created_at’, { ascending: false });

if (error) {
  console.error('Load error:', error);
  return null;
}

if (!data || data.length === 0) {
  return null;
}

return data.map(fromRow);

} catch (error) {
console.error(‘Error loading:’, error);
return null;
}
};

export interface ProjectRow {
name: string;
code: string;
}

export const loadProjects = async (): Promise<ProjectRow[] | null> => {
try {
const { data, error } = await supabase.from(‘projects’).select(‘*’).order(‘name’);

if (error) {
  console.error('Load projects error:', error);
  return null;
}

if (!data || data.length === 0) {
  return null;
}

return data.map(row => ({ name: row.name, code: row.code }));

} catch (error) {
console.error(‘Error loading projects:’, error);
return null;
}
};

export const addProject = async (name: string, code: string): Promise<boolean> => {
try {
const { error } = await supabase.from(‘projects’).insert({ name, code: code.toUpperCase() });

if (error) {
  console.error('Add project error:', error);
  return false;
}

return true;

} catch (error) {
console.error(‘Error adding project:’, error);
return false;
}
};

export const deleteProject = async (name: string): Promise<boolean> => {
try {
const { error } = await supabase.from(‘projects’).delete().eq(‘name’, name);

if (error) {
  console.error('Delete project error:', error);
  return false;
}

return true;

} catch (error) {
console.error(‘Error deleting project:’, error);
return false;
}
};

export interface AppUserRow {
username: string;
displayName: string;
}

export const loadAppUsers = async (): Promise<AppUserRow[] | null> => {
try {
const { data, error } = await supabase
.from(‘app_users’)
.select(‘username, display_name’)
.order(‘display_name’);

if (error) {
  console.error('Load app users error:', error);
  return null;
}
if (!data || data.length === 0) return null;

return data.map(row => ({ username: row.username, displayName: row.display_name }));

} catch (error) {
console.error(‘Error loading app users:’, error);
return null;
}
};

export const addStakeholder = async (username: string, displayName: string): Promise<boolean> => {
try {
const { error } = await supabase
.from(‘app_users’)
.insert({ username, display_name: displayName, password_hash: null });

if (error) {
  console.error('Add stakeholder error:', error);
  return false;
}
return true;

} catch (error) {
console.error(‘Error adding stakeholder:’, error);
return false;
}
};

export const deleteStakeholder = async (username: string): Promise<boolean> => {
try {
const { error } = await supabase.from(‘app_users’).delete().eq(‘username’, username);

if (error) {
  console.error('Delete stakeholder error:', error);
  return false;
}
return true;

} catch (error) {
console.error(‘Error deleting stakeholder:’, error);
return false;
}
};

export interface AuditLogRow {
id: string;
timestamp: string;
userId: string;
userName: string;
action: string;
crId: string;
details: string;
}

export const saveAuditLog = async (log: AuditLogRow): Promise<boolean> => {
try {
const { error } = await supabase.from(‘audit_logs’).insert({
id: log.id,
logged_at: log.timestamp,
user_id: log.userId,
user_name: log.userName,
action: log.action,
cr_id: log.crId,
details: log.details,
});

if (error) {
  console.error('Save audit log error:', error);
  return false;
}
return true;

} catch (error) {
console.error(‘Error saving audit log:’, error);
return false;
}
};

export const loadAuditLogs = async (userId: string): Promise<AuditLogRow[]> => {
try {
const { data, error } = await supabase
.from(‘audit_logs’)
.select(‘*’)
.eq(‘user_id’, userId)
.order(‘logged_at’, { ascending: false })
.limit(200);

if (error || !data) {
  if (error) console.error('Load audit logs error:', error);
  return [];
}

return data.map(row => ({
  id: row.id,
  timestamp: row.logged_at,
  userId: row.user_id,
  userName: row.user_name,
  action: row.action,
  crId: row.cr_id,
  details: row.details,
}));

} catch (error) {
console.error(‘Error loading audit logs:’, error);
return [];
}
};
