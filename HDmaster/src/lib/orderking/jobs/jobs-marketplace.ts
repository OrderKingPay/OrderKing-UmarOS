export enum JobCategory {
  WFH = 'WFH',
  REMOTE = 'REMOTE',
  PART_TIME = 'PART_TIME',
}

export interface JobListing {
  id: string;
  title: string;
  description: string;
  category: JobCategory;
  requiredSkills: string[];
  hourlyRate?: number;
  maxHoursPerWeek?: number;
}

export class JobsMarketplace {
  private jobs: Map<string, JobListing> = new Map();

  addJob(job: JobListing): void {
    if (!Object.values(JobCategory).includes(job.category)) {
      throw new Error(`Invalid category: ${job.category}. Must be WFH, REMOTE, or PART_TIME.`);
    }
    this.jobs.set(job.id, job);
  }

  getJob(id: string): JobListing | undefined {
    return this.jobs.get(id);
  }

  removeJob(id: string): boolean {
    return this.jobs.delete(id);
  }

  getJobsByCategory(category: JobCategory): JobListing[] {
    return Array.from(this.jobs.values()).filter(job => job.category === category);
  }

  getAllJobs(): JobListing[] {
    return Array.from(this.jobs.values());
  }
}
