import test from 'node:test';
import assert from 'node:assert';
import { CurriculumManager, Board, Grade } from './curriculum-manager';
import { AITutor, Question } from './ai-tutor';

test('CurriculumManager initializes with CBSE Grade 10 baseline', () => {
  const cm = new CurriculumManager();
  const curriculum = cm.getCurriculum('CBSE', 10);
  assert.ok(curriculum, 'CBSE Grade 10 should exist');
  assert.strictEqual(curriculum.grade, 10);
  
  const math = curriculum.subjects['Mathematics'];
  assert.ok(math, 'Mathematics subject should exist');
  assert.strictEqual(math.chapters[0].name, 'Real Numbers');
});

test('AITutor progression tracking and quizzes', () => {
  const cm = new CurriculumManager();
  const tutor = new AITutor(cm);

  const profile = tutor.registerStudent('student1', 'CBSE', 10);
  assert.strictEqual(profile.studentId, 'student1');

  const topic = tutor.getNextTopic('student1', 'Mathematics');
  assert.ok(topic, 'Should get the first unmastered topic');
  assert.strictEqual(topic.id, 'cbse-10-math-1-1');

  tutor.addQuestions([
    {
      id: 'q1',
      topicId: 'cbse-10-math-1-1',
      text: 'Which is a prime number?',
      options: ['4', '6', '7', '9'],
      correctOptionIndex: 2,
      explanation: '7 has no divisors other than 1 and 7.'
    },
    {
      id: 'q2',
      topicId: 'cbse-10-math-1-1',
      text: 'Which is composite?',
      options: ['2', '3', '4', '5'],
      correctOptionIndex: 2,
      explanation: '4 is divisible by 2.'
    }
  ]);

  const quiz = tutor.generateQuiz('cbse-10-math-1-1', 2);
  assert.strictEqual(quiz.length, 2);

  // Submit quiz with 100% correct
  const result = tutor.submitQuiz('student1', 'cbse-10-math-1-1', {
    'q1': 2,
    'q2': 2
  });
  
  assert.ok(result);
  assert.strictEqual(result.score, 2);
  assert.strictEqual(result.total, 2);

  const updatedProfile = tutor.getStudentProfile('student1');
  assert.strictEqual(updatedProfile!.topicProgress['cbse-10-math-1-1'], 100);

  // Next topic should now be the next one
  const nextTopic = tutor.getNextTopic('student1', 'Mathematics');
  assert.ok(nextTopic);
  assert.strictEqual(nextTopic.id, 'cbse-10-math-1-2');
});

test('AITutor doubt solving', () => {
  const cm = new CurriculumManager();
  const tutor = new AITutor(cm);
  tutor.registerStudent('student1', 'CBSE', 10);

  const response1 = tutor.resolveDoubt('student1', 'What is a prime number?');
  assert.ok(response1.includes('exactly two factors'));

  const response2 = tutor.resolveDoubt('student1', 'Tell me about irrational numbers');
  assert.ok(response2.includes('non-terminating'));
});
