export const AI_QUEUES = {
  AI_JOBS: "ai-jobs",
};

export const AI_JOB_NAMES = {
  EMBED_JOB: "embed-job",
  SCORE_APPLICATION: "score-application",
  BULK_RANK_JOB: "bulk-rank-job",
};

export interface EmbedJobPayload {
  jobId: string;
}

export interface ScoreApplicationPayload {
  applicationId: string;
  seekerId: string;
  jobId: string;
}

export interface BulkRankJobPayload {
  jobId: string;
}
