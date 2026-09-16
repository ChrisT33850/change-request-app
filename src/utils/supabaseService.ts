import { supabase } from './supabaseClient';

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
  impacts?: any;
  implementation?: any;
  tests?: any;
  risks?: string;
  stakeholders?: string[];
  workflow?: any;
}

export const saveToSupabase = async (changeRequests: CR[]): Promise<boolean> => {
  try {
    // Supprimer toutes les anciennes données
    await supabase.from('change_requests').delete().neq('id', '');

    // Insérer les nouvelles
    const { error } = await supabase.from('change_requests').insert(
      changeRequests.map(cr => ({
        id: cr.id,
        title: cr.title,
        project: cr.project,
        description: cr.description,
        current_status: cr.currentStatus,
        progress_percentage: cr.progressPercentage,
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
      }))
    );

    if (error) {
      console.error('Save error:', error);
      return false;
    }

    console.log('✅ Saved to Supabase!');
    return true;
  } catch (error) {
    console.error('Error saving:', error);
    return false;
  }
};

export const loadFromSupabase = async (): Promise<CR[] | null> => {
  try {
    const { data, error } = await supabase.from('change_requests').select('*');

    if (error) {
      console.error('Load error:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Transformer les données Supabase en format CR
    return data.map(row => ({
      id: row.id,
      title: row.title,
      project: row.project,
      description: row.description,
      currentStatus: row.current_status,
      progressPercentage: row.progress_percentage,
      requesterName: row.requester_name,
      dates: { created: row.created_at, deploymentPlanned: row.deployment_planned },
      impact: { budgetEur: row.budget_eur, delayDays: row.delay_days },
      impacts: row.impacts,
      implementation: row.implementation,
      tests: row.tests,
      risks: row.risks,
      stakeholders: row.stakeholders,
      workflow: row.workflow,
    }));
  } catch (error) {
    console.error('Error loading:', error);
    return null;
  }
};
