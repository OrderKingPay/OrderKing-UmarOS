export type Board = "CBSE" | "ICSE" | "STATE_BOARD" | "SEBA" | "AHSEC";
export type Grade = number | string;

export interface Topic {
  id: string;
  name: string;
  description?: string;
  learningObjectives?: string[];
}

export interface Chapter {
  id: string;
  name: string;
  order: number;
  topics: Topic[];
}

export interface SubjectCurriculum {
  subject: string;
  board: Board;
  grade: Grade;
  chapters: Chapter[];
}

export class CurriculumManager {
  private curricula: Map<string, SubjectCurriculum> = new Map();

  constructor() {
    this.seedDefaultCurricula();
  }

  private getKey(board: Board, grade: Grade, subject: string): string {
    return `${board}:${String(grade).toUpperCase()}:${subject.toLowerCase()}`;
  }

  public registerCurriculum(curriculum: SubjectCurriculum): void {
    const key = this.getKey(curriculum.board, curriculum.grade, curriculum.subject);
    this.curricula.set(key, curriculum);
  }

  public getSubjectCurriculum(
    board: Board,
    grade: Grade,
    subject: string
  ): SubjectCurriculum | undefined {
    const key = this.getKey(board, grade, subject);
    return this.curricula.get(key);
  }

  private seedDefaultCurricula(): void {
    // Standard Class 10 CBSE Mathematics
    this.registerCurriculum({
      subject: "math",
      board: "CBSE",
      grade: 10,
      chapters: [
        {
          id: "ch_real_numbers",
          name: "Real Numbers",
          order: 1,
          topics: [
            { id: "top_euclid_lemma", name: "Fundamental Theorem of Arithmetic" },
            { id: "top_irrationality", name: "Revisiting Irrational Numbers" },
          ],
        },
        {
          id: "ch_polynomials",
          name: "Polynomials",
          order: 2,
          topics: [
            { id: "top_zeroes_poly", name: "Geometrical Meaning of the Zeroes of a Polynomial" },
            { id: "top_coeffs_poly", name: "Relationship between Zeroes and Coefficients" },
          ],
        },
      ],
    });
  }
}
