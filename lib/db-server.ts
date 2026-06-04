import { createClient } from '@supabase/supabase-js';
import { Survey, Response, Report, Statistics } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createSurvey(survey: Omit<Survey, 'id' | 'createdAt'>) {
  const id = `survey_${Date.now()}`;
  const { data, error } = await supabase
    .from('surveys')
    .insert({
      id,
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      created_at: new Date()
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create survey: ${error.message}`);
  return { id, ...data };
}

export async function getSurvey(id: string) {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to get survey: ${error.message}`);
  return data;
}

export async function getSurveys() {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list surveys: ${error.message}`);
  return data || [];
}

export async function addResponse(surveyId: string, data: Record<string, string | number>) {
  const { error } = await supabase
    .from('responses')
    .insert({
      survey_id: surveyId,
      data,
      created_at: new Date()
    });

  if (error) throw new Error(`Failed to save response: ${error.message}`);
}

export async function getResponses(surveyId: string) {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('survey_id', surveyId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to get responses: ${error.message}`);
  return data || [];
}

export async function saveReport(surveyId: string, markdown: string, stats: Statistics) {
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('survey_id', surveyId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('reports')
      .update({
        markdown,
        stats,
        created_at: new Date()
      })
      .eq('id', existing.id);

    if (error) throw new Error(`Failed to update report: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('reports')
      .insert({
        survey_id: surveyId,
        markdown,
        stats,
        created_at: new Date()
      });

    if (error) throw new Error(`Failed to save report: ${error.message}`);
  }
}

export async function getReport(surveyId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('survey_id', surveyId)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to get report: ${error.message}`);
  return data;
}

export async function deleteSurvey(id: string) {
  const { error: error1 } = await supabase
    .from('responses')
    .delete()
    .eq('survey_id', id);

  const { error: error2 } = await supabase
    .from('reports')
    .delete()
    .eq('survey_id', id);

  const { error: error3 } = await supabase
    .from('surveys')
    .delete()
    .eq('id', id);

  if (error1 || error2 || error3) {
    throw new Error('Failed to delete survey');
  }
}
