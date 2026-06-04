import Dexie, { Table } from 'dexie';
import { Survey, Response, Report } from './types';

export class SurveyDB extends Dexie {
  surveys!: Table<Survey>;
  responses!: Table<Response>;
  reports!: Table<Report>;

  constructor() {
    super('SurveyDB');
    this.version(1).stores({
      surveys: '++id, createdAt',
      responses: '++, surveyId, createdAt',
      reports: '++, surveyId, createdAt'
    });
  }
}

export const db = new SurveyDB();

// 설문 관련 함수
export async function createSurvey(survey: Omit<Survey, 'id' | 'createdAt'>) {
  const id = `survey_${Date.now()}`;
  return db.surveys.add({
    ...survey,
    id,
    createdAt: new Date()
  } as Survey);
}

export async function getSurvey(id: string) {
  return db.surveys.get(id);
}

export async function getSurveys() {
  return db.surveys.toArray();
}

export async function deleteSurvey(id: string) {
  await db.surveys.delete(id);
  await db.responses.where('surveyId').equals(id).delete();
  await db.reports.where('surveyId').equals(id).delete();
}

// 응답 관련 함수
export async function addResponse(surveyId: string, data: Record<string, string | number>) {
  return db.responses.add({
    surveyId,
    data,
    createdAt: new Date()
  });
}

export async function getResponses(surveyId: string) {
  return db.responses.where('surveyId').equals(surveyId).toArray();
}

// 리포트 관련 함수
export async function saveReport(surveyId: string, markdown: string, stats: any) {
  const existing = await db.reports.where('surveyId').equals(surveyId).first();
  if (existing) {
    return db.reports.update(existing.id, {
      markdown,
      stats,
      createdAt: new Date()
    });
  }
  return db.reports.add({
    surveyId,
    markdown,
    stats,
    createdAt: new Date()
  });
}

export async function getReport(surveyId: string) {
  return db.reports.where('surveyId').equals(surveyId).first();
}
