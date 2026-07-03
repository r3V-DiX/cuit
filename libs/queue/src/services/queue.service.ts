// libs/queue/services/queue.service.ts
import { Injectable } from "@nestjs/common";
import { IQueueService, QueueJobOptions } from "../interfaces/queue.interface";

@Injectable()
export abstract class QueueService implements IQueueService {
  abstract addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: QueueJobOptions,
  ): Promise<void>;
  abstract addBulkJobs<T>(
    queueName: string,
    jobs: Array<{ name: string; data: T; options?: QueueJobOptions }>,
  ): Promise<void>;
  abstract getJobStatus(queueName: string, jobId: string): Promise<any>;
  abstract removeJob(queueName: string, jobId: string): Promise<void>;
  abstract cleanQueue(queueName: string, grace: number): Promise<void>;
  abstract getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>;
}
