export type QuestionType = 'rating' | 'nps' | 'single' | 'multiple' | 'text';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  required: boolean;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: Date;
}

export interface Response {
  surveyId: string;
  data: Record<string, string | number>;
  createdAt: Date;
}

export interface Statistics {
  [questionId: string]: {
    type: QuestionType;
    text: string;
  } & (
    | {
        type: 'rating' | 'nps';
        mean: number;
        std: number;
        min: number;
        max: number;
      }
    | {
        type: 'single' | 'multiple';
        frequency: Record<string, number>;
        total: number;
      }
    | {
        type: 'text';
        responses: string[];
      }
  );
}

export interface Report {
  surveyId: string;
  markdown: string;
  stats: Statistics;
  createdAt: Date;
}
