import { supabase } from './supabaseClient';

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
  implementationDate?: string;
  newFlowVersion?: string;
  testDate?: string;
  testComments?: string;
  stakeholders?: string[];
  workflow?: any;
}

// Converts a CR (app format) into a Supabase row.
// Fields without a dedicated column are stored in the "extra" jsonb column.
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
    benefits: cr.benefits ?? '',
    communicationRequired: cr.communicationRequired ?? 'No',
    justificationOfChange: cr.justificationOfChange ?? '',
    listOfChanges: cr.listOfChanges ?? '',
    impactedFlow: cr.impactedFlow ?? '',
    impactedFlowVersion: cr.impactedFlowVersion ?? '',
    implementationDate: cr.implementationDate ?? '',
    newFlowVersion: cr.newFlowVersion ?? '',
    testDate: cr.testDate ?? '',
    testComments: cr.testComments ?? '',
  },
});

// Converts a Supabase row into a CR (app format)
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
    implementationDate: extra.implementationDate,
    newFlowVersion: extra.newFlowVersion,
    testDate: extra.testDate,
    testComments: extra.testComments,
  };
};

// Saves ONE change request (insert or update). Other rows are never touched.
export const saveCR = async (cr: CR): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('change_requests')
      .upsert(toRow(cr), { onConflict: 'id' });

    if (error) {
      console.error('Save CR error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving CR:', error);
    return false;
  }
};

// Deletes ONE change request
export const deleteCRById = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('change_requests').delete().eq('id', id);

    if (error) {
      console.error('Delete CR error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting CR:', error);
    return false;
  }
};

// Loads the latest stored version of ONE change request
export const loadCRById = async (id: string): Promise<CR | null> => {
  try {
    const { data, error } = await supabase
      .from('change_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('Load CR error:', error);
      return null;
    }
    return fromRow(data);
  } catch (error) {
    console.error('Error loading CR:', error);
    return null;
  }
};

export const loadFromSupabase = async (): Promise<CR[] | null> => {
  try {
    const { data, error } = await supabase
      .from('change_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load error:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data.map(fromRow);
  } catch (error) {
    console.error('Error loading:', error);
    return null;
  }
};

// --- Projects (manageable from the app instead of hardcoded) ---

export interface ProjectRow {
  name: string;
  code: string;
}

export const loadProjects = async (): Promise<ProjectRow[] | null> => {
  try {
    const { data, error } = await supabase.from('projects').select('*').order('name');

    if (error) {
      console.error('Load projects error:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data.map(row => ({ name: row.name, code: row.code }));
  } catch (error) {
    console.error('Error loading projects:', error);
    return null;
  }
};

export const addProject = async (name: string, code: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('projects').insert({ name, code: code.toUpperCase() });

    if (error) {
      console.error('Add project error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding project:', error);
    return false;
  }
};

export const deleteProject = async (name: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('projects').delete().eq('name', name);

    if (error) {
      console.error('Delete project error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
};
