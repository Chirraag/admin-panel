export interface Submission {
  id: string;
  call_id: string;
  callDuration: number;
  metrics: {
    clarity: number;
    pace: string;
    tonality: string;
    wordsPerMinute: number;
  };
  recommendations: string[];
  title: string;
  recordingUrl: string;
  transcript: string;
  createdAt?: Date;
}