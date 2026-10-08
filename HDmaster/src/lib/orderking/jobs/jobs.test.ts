import test from 'node:test';
import assert from 'node:assert';
import { JobsMarketplace, JobCategory, JobListing } from './jobs-marketplace';
import { AIWorkMatcher, WorkerProfile } from './ai-work-matcher';

test('JobsMarketplace - add and retrieve jobs', () => {
  const marketplace = new JobsMarketplace();
  
  const job1: JobListing = {
    id: 'j1',
    title: 'Frontend Dev',
    description: 'React developer',
    category: JobCategory.REMOTE,
    requiredSkills: ['React', 'TypeScript']
  };

  const job2: JobListing = {
    id: 'j2',
    title: 'Data Entry',
    description: 'Simple data entry',
    category: JobCategory.PART_TIME,
    requiredSkills: ['Excel'],
    hourlyRate: 15
  };

  marketplace.addJob(job1);
  marketplace.addJob(job2);

  assert.strictEqual(marketplace.getAllJobs().length, 2);
  assert.strictEqual(marketplace.getJob('j1')?.title, 'Frontend Dev');
  
  const remoteJobs = marketplace.getJobsByCategory(JobCategory.REMOTE);
  assert.strictEqual(remoteJobs.length, 1);
  assert.strictEqual(remoteJobs[0].id, 'j1');
});

test('JobsMarketplace - remove job', () => {
  const marketplace = new JobsMarketplace();
  marketplace.addJob({
    id: 'j1',
    title: 'Tester',
    description: 'QA',
    category: JobCategory.WFH,
    requiredSkills: []
  });

  assert.strictEqual(marketplace.getAllJobs().length, 1);
  const removed = marketplace.removeJob('j1');
  assert.strictEqual(removed, true);
  assert.strictEqual(marketplace.getAllJobs().length, 0);
});

test('AIWorkMatcher - calculate scores', () => {
  const matcher = new AIWorkMatcher();
  
  const jobs: JobListing[] = [
    {
      id: 'j1',
      title: 'Fullstack Dev',
      description: 'Node and React',
      category: JobCategory.REMOTE,
      requiredSkills: ['Node.js', 'React', 'TypeScript'],
      hourlyRate: 50,
      maxHoursPerWeek: 40
    },
    {
      id: 'j2',
      title: 'Backend Dev',
      description: 'Node expert',
      category: JobCategory.WFH,
      requiredSkills: ['Node.js', 'PostgreSQL'],
      hourlyRate: 45,
      maxHoursPerWeek: 20
    }
  ];

  const worker: WorkerProfile = {
    id: 'w1',
    skills: ['node.js', 'typescript', 'react'],
    availableHoursPerWeek: 30,
    minHourlyRate: 40
  };

  const matches = matcher.matchWorkerToJobs(worker, jobs);
  
  assert.strictEqual(matches.length, 2);
  
  // Job j1: skill match 3/3 (100% * 60 = 60), availability 30/40 (75% * 20 = 15), rate ok (100% * 20 = 20) -> 95
  // Job j2: skill match 1/2 (50% * 60 = 30), availability min(1, 30/20)=1 (100% * 20 = 20), rate ok (100% * 20 = 20) -> 70
  
  const j1Match = matches.find(m => m.jobId === 'j1');
  const j2Match = matches.find(m => m.jobId === 'j2');
  
  assert.ok(j1Match);
  assert.ok(j2Match);
  
  assert.strictEqual(j1Match.matchDetails.skillMatchPercentage, 100);
  assert.strictEqual(j1Match.matchDetails.rateScore, 100);
  
  assert.strictEqual(j2Match.matchDetails.skillMatchPercentage, 50);
  assert.strictEqual(j2Match.matchDetails.availabilityScore, 100);

  // Sorting should be descending
  assert.strictEqual(matches[0].jobId, 'j1');
  assert.strictEqual(matches[1].jobId, 'j2');
});

test('AIWorkMatcher - handles rate penalty', () => {
  const matcher = new AIWorkMatcher();
  const jobs: JobListing[] = [
    {
      id: 'j1',
      title: 'Cheap Work',
      description: 'Low pay',
      category: JobCategory.PART_TIME,
      requiredSkills: ['typing'],
      hourlyRate: 10,
      maxHoursPerWeek: 10
    }
  ];

  const worker: WorkerProfile = {
    id: 'w1',
    skills: ['typing'],
    availableHoursPerWeek: 20,
    minHourlyRate: 15
  };

  const matches = matcher.matchWorkerToJobs(worker, jobs);
  const match = matches[0];
  
  // Rate score: max(0, 1 - (15-10)/10) = max(0, 1 - 0.5) = 0.5 -> 50%
  assert.strictEqual(match.matchDetails.rateScore, 50);
});
