import { useMemo, useState } from "react";
import { CurriculumManager, Board, Grade } from "@/lib/orderking/education/curriculum-manager";
import { AITutor, StudentProfile } from "@/lib/orderking/education/ai-tutor";
import { Panel, MetricCard, DataTable } from "@/components/command/widgets";
import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const curriculumManager = new CurriculumManager();
const tutor = new AITutor(curriculumManager);

// Add some dummy progress
tutor.registerStudent("stu_001", "CBSE", 10);
const p1 = tutor.getStudentProfile("stu_001")!;
p1.topicProgress["cbse-10-math-1-1"] = 100;
p1.topicProgress["cbse-10-math-1-2"] = 60;
p1.topicProgress["cbse-10-sci-1-1"] = 90;

tutor.registerStudent("stu_002", "CBSE", 10);
const p2 = tutor.getStudentProfile("stu_002")!;
p2.topicProgress["cbse-10-math-1-1"] = 40;

export function EducationDashboard() {
  const [selectedBoard, setSelectedBoard] = useState<Board>("CBSE");
  const [selectedGrade, setSelectedGrade] = useState<Grade>(10);

  const curriculum = useMemo(() => {
    return curriculumManager.getCurriculum(selectedBoard, selectedGrade);
  }, [selectedBoard, selectedGrade]);

  const allProfiles = useMemo(() => {
    // hack to get profiles for dashboard
    const profiles: StudentProfile[] = [];
    // @ts-ignore - access private for debug UI
    for (const p of tutor.studentProfiles.values()) {
      profiles.push(p);
    }
    return profiles;
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Education Ecosystem</p>
          <h1 className="font-display text-3xl">AI Tutor Management</h1>
          <p className="mt-1 text-sm text-muted">Oversee syllabus completion and student mastery</p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Active Students" value={allProfiles.length.toString()} />
        <MetricCard label="Active Boards" value="1 (CBSE)" />
        <MetricCard label="Topics Covered" value={curriculum ? Object.values(curriculum.subjects).flatMap(s => s.chapters.flatMap(c => c.topics)).length.toString() : "0"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Syllabus Tracker">
          <div className="mb-4 flex gap-2">
            <select
              className="h-10 rounded-[10px] border border-border bg-elevated px-2 text-sm"
              value={selectedBoard}
              onChange={e => setSelectedBoard(e.target.value as Board)}
            >
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
            </select>
            <select
              className="h-10 rounded-[10px] border border-border bg-elevated px-2 text-sm"
              value={selectedGrade}
              onChange={e => setSelectedGrade(Number(e.target.value) as Grade)}
            >
              <option value={10}>Grade 10</option>
            </select>
          </div>

          {curriculum ? (
            <div className="space-y-4">
              {Object.values(curriculum.subjects).map(sub => (
                <div key={sub.subject} className="rounded-[12px] border border-border bg-surface p-3">
                  <h3 className="font-semibold">{sub.subject}</h3>
                  <div className="mt-2 space-y-2">
                    {sub.chapters.map(ch => (
                      <div key={ch.id} className="text-sm">
                        <div className="font-medium text-muted-foreground">{ch.name}</div>
                        <ul className="mt-1 ml-4 list-disc space-y-1 text-xs">
                          {ch.topics.map(t => (
                            <li key={t.id}>{t.name}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No curriculum found for this selection.</p>
          )}
        </Panel>

        <Panel title="Student Progression">
          <DataTable
            columns={[
              { key: "student", label: "Student ID" },
              { key: "board", label: "Board/Grade" },
              { key: "mastery", label: "Top Mastery" },
              { key: "opportunities", label: "Unlocked Opportunities" }
            ]}
            rows={allProfiles.map(p => {
              const masteredCount = Object.values(p.topicProgress).filter(v => v >= 80).length;
              const totalAttempted = Object.keys(p.topicProgress).length;
              const unlockedOps = tutor.getUnlockedOpportunities(p.studentId);
              
              return {
                _id: p.studentId,
                student: p.studentId,
                board: `${p.board} / Gr ${p.grade}`,
                mastery: (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{masteredCount}/{totalAttempted} Topics</span>
                    {masteredCount > 0 ? <Badge tone="success">Advancing</Badge> : <Badge tone="warning">Learning</Badge>}
                  </div>
                ),
                opportunities: (
                  <div className="flex flex-col gap-1">
                    {unlockedOps.length > 0 ? unlockedOps.map((op, idx) => (
                      <span key={idx} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block whitespace-nowrap">
                        {op}
                      </span>
                    )) : <span className="text-xs text-muted">None yet</span>}
                  </div>
                )
              };
            })}
          />
        </Panel>

        <Panel title="Interactive Assessment & Opportunities Engine">
          <div className="space-y-4">
            <div className="p-4 border rounded-xl bg-slate-50">
              <h3 className="font-semibold mb-2">Verified Skills to Opportunities</h3>
              <p className="text-sm text-slate-600 mb-4">
                Our AI Tutor maps topic mastery (85%+) directly to verified freelance and tutoring opportunities. No fake jobs, no guaranteed income claims. Pure skill-based meritocracy with transparent monetization.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm p-2 bg-white rounded border">
                  <span>Peer Tutor (Math)</span>
                  <Badge tone="default">Requires 2 topics mastered</Badge>
                </div>
                <div className="flex justify-between items-center text-sm p-2 bg-white rounded border">
                  <span>Content QA Reviewer (Science)</span>
                  <Badge tone="default">Requires 4 topics mastered</Badge>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
