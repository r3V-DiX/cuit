// libs/queue/interfaces/queue.interface.ts
export interface QueueJob<T = any> {
  id: string | number;
  data: T;
  attempts: number;
  timestamp: number;
}

export interface QueueJobOptions {
  attempts?: number;
  delay?: number;
  priority?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export interface IQueueService {
  addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: QueueJobOptions,
  ): Promise<void>;
  addBulkJobs<T>(
    queueName: string,
    jobs: Array<{ name: string; data: T; options?: QueueJobOptions }>,
  ): Promise<void>;
  getJobStatus(queueName: string, jobId: string): Promise<any>;
  removeJob(queueName: string, jobId: string): Promise<void>;
  cleanQueue(queueName: string, grace: number): Promise<void>;
  getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>;
}
