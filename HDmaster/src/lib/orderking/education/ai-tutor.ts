import { Board, Grade, CurriculumManager, Topic } from './curriculum-manager';

export interface StudentProfile {
  studentId: string;
  board: Board;
  grade: Grade;
  topicProgress: Record<string, number>; // topicId -> mastery percentage (0-100)
}

export interface Question {
  id: string;
  topicId: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface QuizResult {
  score: number;
  total: number;
  topicId: string;
  masteryDelta: number;
}

export class AITutor {
  private curriculumManager: CurriculumManager;
  private studentProfiles: Map<string, StudentProfile> = new Map();
  // Question Bank
  private questions: Question[] = [];

  constructor(curriculumManager: CurriculumManager) {
    this.curriculumManager = curriculumManager;
  }

  public registerStudent(studentId: string, board: Board, grade: Grade): StudentProfile {
    const profile: StudentProfile = {
      studentId,
      board,
      grade,
      topicProgress: {}
    };
    this.studentProfiles.set(studentId, profile);
    return profile;
  }

  public getStudentProfile(studentId: string): StudentProfile | undefined {
    return this.studentProfiles.get(studentId);
  }

  public getNextTopic(studentId: string, subject: string): Topic | undefined {
    const profile = this.studentProfiles.get(studentId);
    if (!profile) return undefined;

    const curriculum = this.curriculumManager.getSubjectCurriculum(profile.board, profile.grade, subject);
    if (!curriculum) return undefined;

    for (const chapter of curriculum.chapters) {
      for (const topic of chapter.topics) {
        const mastery = profile.topicProgress[topic.id] || 0;
        if (mastery < 80) { // arbitrary threshold for mastery
          return topic;
        }
      }
    }
    return undefined; // All mastered
  }

  public addQuestions(newQuestions: Question[]): void {
    this.questions.push(...newQuestions);
  }

  public generateQuiz(topicId: string, count: number): Question[] {
    const topicQuestions = this.questions.filter(q => q.topicId === topicId);
    // Shuffle and pick 'count' questions (simple implementation)
    return topicQuestions.slice(0, count);
  }

  public submitQuiz(studentId: string, topicId: string, answers: Record<string, number>): QuizResult | undefined {
    const profile = this.studentProfiles.get(studentId);
    if (!profile) return undefined;

    const topicQuestions = this.questions.filter(q => q.topicId === topicId);
    if (topicQuestions.length === 0) return undefined;

    let correct = 0;
    let total = 0;

    for (const [questionId, answerIndex] of Object.entries(answers)) {
      const q = topicQuestions.find(q => q.id === questionId);
      if (q) {
        total++;
        if (q.correctOptionIndex === answerIndex) {
          correct++;
        }
      }
    }

    if (total === 0) return undefined;

    const score = correct;
    const percentage = (correct / total) * 100;
    
    // Update mastery: simple rolling average or increment
    const currentMastery = profile.topicProgress[topicId] || 0;
    
    // Simple logic: increase mastery if > 50%, decrease if < 50%
    let delta = 0;
    if (percentage === 100) delta = 20;
    else if (percentage >= 75) delta = 10;
    else if (percentage >= 50) delta = 0;
    else delta = -10;

    let newMastery = Math.min(100, Math.max(0, currentMastery + delta));
    
    // First quiz sets base mastery if current is 0
    if (currentMastery === 0 && delta > 0) {
      newMastery = percentage;
    }

    const actualDelta = newMastery - currentMastery;
    profile.topicProgress[topicId] = newMastery;

    return {
      score,
      total,
      topicId,
      masteryDelta: actualDelta
    };
  }

  public resolveDoubt(studentId: string, query: string, contextTopicId?: string): string {
    const profile = this.studentProfiles.get(studentId);
    if (!profile) return "Student not found.";

    // Simple NLP mockup based on query keywords
    const queryLower = query.toLowerCase();

    if (queryLower.includes("prime") || queryLower.includes("composite")) {
       return "A prime number has exactly two factors: 1 and itself. A composite number has more than two factors. For example, 2 is prime, but 4 is composite.";
    }

    if (queryLower.includes("irrational")) {
       return "An irrational number cannot be expressed as a simple fraction (p/q). Its decimal expansion is non-terminating and non-repeating, like the square root of 2 or pi.";
    }
    
    if (queryLower.includes("zeroes") || queryLower.includes("polynomial")) {
      return "The zeroes of a polynomial are the values of x for which the polynomial equals zero. Geometrically, these are the x-intercepts of its graph.";
    }

    return "I am an AI Tutor. I don't have a specific answer for that yet, but I recommend reviewing the related topic material.";
  }
}
