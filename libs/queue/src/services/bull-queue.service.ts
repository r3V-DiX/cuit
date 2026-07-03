// libs/queue/services/bull-queue.service.ts
import { Injectable } from "@nestjs/common";
import type { Queue } from "bull";
import { QueueService } from "./queue.service";
import { QueueJobOptions } from "../interfaces/queue.interface";
import { AppLogger } from "@cykruit/logger";

@Injectable()
export class BullQueueService extends QueueService {
  private queues = new Map<string, Queue>();

  constructor(private readonly logger: AppLogger) {
    super();
  }

  registerQueue(queueName: string, queue: Queue): void {
    this.queues.set(queueName, queue);
  }

  private getQueue(queueName: string): Queue {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue "${queueName}" not registered`);
    return queue;
  }

  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: QueueJobOptions,
  ): Promise<void> {
    try {
      await this.getQueue(queueName).add(jobName, data, options);
      this.logger.log(
        `Job "${jobName}" added to queue "${queueName}"`,
        "BullQueueService",
      );
    } catch (error) {
      this.logger.error(
        `Failed to add job "${jobName}" to "${queueName}"`,
        error,
        "BullQueueService",
      );
      throw error;
    }
  }

  async addBulkJobs<T>(
    queueName: string,
    jobs: Array<{ name: string; data: T; options?: QueueJobOptions }>,
  ): Promise<void> {
    try {
      await this.getQueue(queueName).addBulk(
        jobs.map((j) => ({ name: j.name, data: j.data, opts: j.options })),
      );
      this.logger.log(
        `${jobs.length} bulk jobs added to "${queueName}"`,
        "BullQueueService",
      );
    } catch (error) {
      this.logger.error(
        `Failed bulk add to "${queueName}"`,
        error,
        "BullQueueService",
      );
      throw error;
    }
  }

  async getJobStatus(queueName: string, jobId: string): Promise<any> {
    const job = await this.getQueue(queueName).getJob(jobId);
    if (!job) return null;
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: await job.progress(),
      state: await job.getState(),
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getQueue(queueName).getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(
        `Job ${jobId} removed from "${queueName}"`,
        "BullQueueService",
      );
    }
  }

  async cleanQueue(
    queueName: string,
    grace: number = 3_600_000,
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.clean(grace, "completed");
    await queue.clean(grace, "failed");
    this.logger.log(`Queue "${queueName}" cleaned`, "BullQueueService");
  }

  async getQueueStats(queueName: string) {
    const counts = await this.getQueue(queueName).getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
    };
  }
}
