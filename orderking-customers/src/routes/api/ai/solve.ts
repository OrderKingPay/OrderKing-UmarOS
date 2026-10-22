import { createFileRoute } from "@tanstack/react-router";
import { solveAcademicProblem, type AcademicSolveParams } from "@/lib/server/gemini-tutor-solver";
import { generateCurriculumFallback } from "@/routes/tutor";

export const Route = createFileRoute("/api/ai/solve")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const body = (await request.json()) as Partial<AcademicSolveParams>;

          if (!body || !body.message || !body.message.trim()) {
            return new Response(
              JSON.stringify({ error: "message parameter is required" }),
              {
                status: 400,
                headers: { "content-type": "application/json; charset=utf-8" },
              }
            );
          }

          const params: AcademicSolveParams = {
            message: body.message.trim(),
            board: body.board || "CBSE (Central Board)",
            stdClass: body.stdClass || "Class 10",
            subject: body.subject || "Mathematics",
            language: body.language || "English",
            difficulty: body.difficulty,
            tone: body.tone,
            goal: body.goal,
            history: body.history,
          };

          const solution = await solveAcademicProblem(params, generateCurriculumFallback);

          return new Response(JSON.stringify(solution), {
            status: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        } catch (error: any) {
          console.error("[/api/ai/solve] Server handler error:", error);
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Internal tutor solver error",
            }),
            {
              status: 500,
              headers: { "content-type": "application/json; charset=utf-8" },
            }
          );
        }
      },
    },
  },
});
