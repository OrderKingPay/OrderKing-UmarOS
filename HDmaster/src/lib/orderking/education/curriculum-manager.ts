export type Board = 'CBSE' | 'ICSE';
export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface Topic {
  id: string;
  name: string;
  description: string;
}

export interface Chapter {
  id: string;
  name: string;
  topics: Topic[];
}

export interface SubjectCurriculum {
  subject: string;
  chapters: Chapter[];
}

export interface GradeCurriculum {
  grade: Grade;
  subjects: Record<string, SubjectCurriculum>;
}

export interface BoardCurriculum {
  board: Board;
  grades: Record<Grade, GradeCurriculum>;
}

export class CurriculumManager {
  private curriculums: Map<Board, BoardCurriculum> = new Map();

  constructor() {
    this.initializeDefaultCurriculums();
  }

  private initializeDefaultCurriculums() {
    // Initialize a minimal baseline for CBSE Grade 10
    const cbseGrade10: GradeCurriculum = {
      grade: 10,
      subjects: {
        'Mathematics': {
          subject: 'Mathematics',
          chapters: [
            {
              id: 'cbse-10-math-1',
              name: 'Real Numbers',
              topics: [
                { id: 'cbse-10-math-1-1', name: 'Fundamental Theorem of Arithmetic', description: 'Understanding primes and composites' },
                { id: 'cbse-10-math-1-2', name: 'Revisiting Irrational Numbers', description: 'Proofs of irrationality' }
              ]
            },
            {
              id: 'cbse-10-math-2',
              name: 'Polynomials',
              topics: [
                { id: 'cbse-10-math-2-1', name: 'Zeroes of a Polynomial', description: 'Geometrical meaning of the zeroes of a polynomial' },
                { id: 'cbse-10-math-2-2', name: 'Relationship between Zeroes and Coefficients', description: 'Sum and product of zeroes' }
              ]
            }
          ]
        },
        'Science': {
          subject: 'Science',
          chapters: [
            {
              id: 'cbse-10-sci-1',
              name: 'Chemical Reactions and Equations',
              topics: [
                { id: 'cbse-10-sci-1-1', name: 'Chemical Equations', description: 'Writing and balancing equations' },
                { id: 'cbse-10-sci-1-2', name: 'Types of Chemical Reactions', description: 'Combination, decomposition, displacement' }
              ]
            }
          ]
        }
      }
    };

    const cbse: BoardCurriculum = {
      board: 'CBSE',
      grades: {
        10: cbseGrade10
      } as Record<Grade, GradeCurriculum> // type coercion for partial data
    };

    this.curriculums.set('CBSE', cbse);
  }

  public getCurriculum(board: Board, grade: Grade): GradeCurriculum | undefined {
    return this.curriculums.get(board)?.grades[grade];
  }

  public getSubjectCurriculum(board: Board, grade: Grade, subject: string): SubjectCurriculum | undefined {
    return this.getCurriculum(board, grade)?.subjects[subject];
  }

  public addSubjectCurriculum(board: Board, grade: Grade, subjectCurriculum: SubjectCurriculum): void {
    let boardCurr = this.curriculums.get(board);
    if (!boardCurr) {
      boardCurr = { board, grades: {} as Record<Grade, GradeCurriculum> };
      this.curriculums.set(board, boardCurr);
    }

    let gradeCurr = boardCurr.grades[grade];
    if (!gradeCurr) {
      gradeCurr = { grade, subjects: {} };
      boardCurr.grades[grade] = gradeCurr;
    }

    gradeCurr.subjects[subjectCurriculum.subject] = subjectCurriculum;
  }
}
