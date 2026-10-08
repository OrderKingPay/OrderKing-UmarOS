import React, { useState, useMemo } from 'react';
import { AIWorkMatcher, WorkerProfile, MatchScore } from '../../lib/orderking/jobs/ai-work-matcher';
import { JobListing, JobCategory } from '../../lib/orderking/jobs/jobs-marketplace';

interface WorkMarketplaceControlCenterProps {
  jobs: JobListing[];
  workers: WorkerProfile[];
}

export function WorkMarketplaceControlCenter({ jobs, workers }: WorkMarketplaceControlCenterProps) {
  const [selectedCategory, setSelectedCategory] = useState<JobCategory>(JobCategory.WFH);
  
  const matcher = useMemo(() => new AIWorkMatcher(), []);

  // Compute matches
  // For each job, find how many workers have a score > 0 (or some threshold)
  const jobMatches = useMemo(() => {
    const matchesByJob = new Map<string, Array<{ worker: WorkerProfile; score: MatchScore }>>();
    
    jobs.forEach(job => matchesByJob.set(job.id, []));

    workers.forEach(worker => {
      const scores = matcher.matchWorkerToJobs(worker, jobs);
      scores.forEach(score => {
        if (score.score > 50) { // Threshold for a "good" match
          const jobMatchList = matchesByJob.get(score.jobId);
          if (jobMatchList) {
            jobMatchList.push({ worker, score });
          }
        }
      });
    });

    return matchesByJob;
  }, [jobs, workers, matcher]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => job.category === selectedCategory);
  }, [jobs, selectedCategory]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Marketplace</h1>
          <p className="text-muted-foreground">Founder Control Center & Matching Engine</p>
        </div>
        <div className="flex space-x-4 bg-muted/50 p-2 rounded-lg">
          <div className="flex flex-col items-center px-4">
            <span className="text-2xl font-bold text-primary">{jobs.length}</span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Jobs</span>
          </div>
          <div className="w-px bg-border"></div>
          <div className="flex flex-col items-center px-4">
            <span className="text-2xl font-bold text-primary">{workers.length}</span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Workers</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 border-b pb-px">
        {Object.values(JobCategory).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              selectedCategory === category
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }`}
          >
            {category.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
            No jobs found in this category.
          </div>
        ) : (
          filteredJobs.map(job => {
            const matches = jobMatches.get(job.id) || [];
            const sortedMatches = [...matches].sort((a, b) => b.score.score - a.score.score);
            
            return (
              <div key={job.id} className="border rounded-xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden">
                <div className="p-5 border-b bg-muted/20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg leading-tight">{job.title}</h3>
                    {job.hourlyRate && (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        ${job.hourlyRate}/hr
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.map(skill => (
                      <span key={skill} className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="p-5 flex-1 bg-gradient-to-b from-transparent to-muted/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">Matching Engine</h4>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${
                      matches.length > 0 ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10' : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                    }`}>
                      {matches.length} Workers Match
                    </span>
                  </div>

                  {matches.length > 0 ? (
                    <div className="space-y-3">
                      {sortedMatches.slice(0, 3).map((match, idx) => (
                        <div key={match.worker.id} className="flex items-center justify-between p-2 rounded-md bg-background border text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              W{idx + 1}
                            </div>
                            <span className="font-medium text-xs truncate max-w-[100px]" title={match.worker.id}>
                              {match.worker.id.substring(0, 8)}...
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-blue-600">{match.score.score.toFixed(0)} pts</span>
                              <span className="text-[10px] text-muted-foreground">{match.score.matchDetails.skillMatchPercentage.toFixed(0)}% skill</span>
                            </div>
                            <div className="h-6 w-1 rounded-full bg-muted overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ height: `${Math.min(100, match.score.score)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {matches.length > 3 && (
                        <div className="text-center pt-1">
                          <span className="text-xs text-muted-foreground hover:text-primary cursor-pointer">
                            + {matches.length - 3} more matches
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-muted-foreground bg-background rounded-md border border-dashed">
                      <svg className="w-6 h-6 mb-1 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-xs">No suitable matches</span>
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t bg-muted/30">
                  <button className="w-full py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm">
                    Review Matches & Dispatch
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
