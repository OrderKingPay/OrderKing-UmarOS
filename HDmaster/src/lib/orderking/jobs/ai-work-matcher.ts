import { JobListing } from './jobs-marketplace';

export interface WorkerProfile {
  id: string;
  skills: string[];
  availableHoursPerWeek: number;
  minHourlyRate: number;
}

export interface MatchScore {
  jobId: string;
  score: number;
  matchDetails: {
    skillMatchPercentage: number;
    availabilityScore: number;
    rateScore: number;
  };
}

export class AIWorkMatcher {
  matchWorkerToJobs(worker: WorkerProfile, jobs: JobListing[]): MatchScore[] {
    const scores = jobs.map(job => this.calculateMatchScore(worker, job));
    // Filter out completely incompatible jobs (score <= 0) and sort by score descending
    return scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  }

  private calculateMatchScore(worker: WorkerProfile, job: JobListing): MatchScore {
    // 1. Skill Match (Weight: 60%)
    let skillScore = 0;
    if (job.requiredSkills.length > 0) {
      const matchedSkills = job.requiredSkills.filter(skill => 
        worker.skills.some(ws => ws.toLowerCase() === skill.toLowerCase())
      );
      skillScore = matchedSkills.length / job.requiredSkills.length;
    } else {
      skillScore = 1; // No specific skills required, perfect skill match
    }

    // 2. Availability Match (Weight: 20%)
    let availabilityScore = 1;
    if (job.maxHoursPerWeek) {
      if (worker.availableHoursPerWeek < (job.maxHoursPerWeek * 0.5)) {
        // Worker has less than half the max hours, penalty
        availabilityScore = Math.max(0, worker.availableHoursPerWeek / job.maxHoursPerWeek);
      } else {
        availabilityScore = Math.min(1, worker.availableHoursPerWeek / job.maxHoursPerWeek);
      }
    }

    // 3. Rate Match (Weight: 20%)
    let rateScore = 1;
    if (job.hourlyRate) {
      if (worker.minHourlyRate > job.hourlyRate) {
        // Worker wants more than the job pays, scale down the score
        rateScore = Math.max(0, 1 - ((worker.minHourlyRate - job.hourlyRate) / job.hourlyRate));
      }
    }

    const totalScore = (skillScore * 60) + (availabilityScore * 20) + (rateScore * 20);

    return {
      jobId: job.id,
      score: totalScore,
      matchDetails: {
        skillMatchPercentage: skillScore * 100,
        availabilityScore: availabilityScore * 100,
        rateScore: rateScore * 100
      }
    };
  }
}
