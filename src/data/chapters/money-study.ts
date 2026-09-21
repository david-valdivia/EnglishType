import type { Chapter } from '../types'

/** The topics asked for that nothing else covered: exams, payday and borrowing. */
export const MONEY_STUDY_CHAPTERS: Omit<Chapter, 'group'>[] = [
  {
    id: 'exams',
    title: 'Exams & Study',
    icon: 'graduation-cap',
    words: [
      { id: 'ex-exam-2', word: 'sit an exam', translation: 'presentarse a un examen', meaning: 'to take a formal test', sentence: 'I sit the exam on Tuesday.', icon: 'memo' },
      { id: 'ex-revise', word: 'revise', translation: 'repasar', meaning: 'to study what you already learned', sentence: 'She revised all weekend.', icon: 'books' },
      { id: 'ex-pass-2', word: 'pass the exam', translation: 'aprobar', meaning: 'to reach the required mark', sentence: 'He passed the exam first time.', icon: 'check-mark-button' },
      { id: 'ex-fail-2', word: 'fail the exam', translation: 'suspender', meaning: 'not to reach the required mark', sentence: 'Nobody failed the exam.', icon: 'cross-mark' },
      { id: 'ex-grade', word: 'grade', translation: 'nota', meaning: 'the mark you were given', sentence: 'My grade was better than expected.', icon: 'sports-medal' },
      { id: 'ex-resit', word: 'resit', translation: 'recuperación', meaning: 'a second chance at a failed exam', sentence: 'The resit is in September.', icon: 'counterclockwise-arrows-button' },
      { id: 'ex-cram', word: 'cram', translation: 'empollar', meaning: 'to study intensely at the last moment', sentence: 'Do not cram the night before.', icon: 'alarm-clock' },
      { id: 'ex-deadline-3', word: 'hand in', translation: 'entregar', meaning: 'to submit work by a date', sentence: 'Hand in the essay by Friday.', icon: 'page-facing-up' },
      { id: 'ex-certificate', word: 'certificate', translation: 'certificado', meaning: 'proof that you passed', sentence: 'The certificate arrives by post.', icon: 'scroll' },
      { id: 'ex-degree', word: 'degree', translation: 'carrera', meaning: 'a university qualification', sentence: 'She finished her degree in June.', icon: 'graduation-cap' },
    ],
  },
  {
    id: 'payday',
    title: 'Payday',
    icon: 'money-bag',
    words: [
      { id: 'pd-payday', word: 'payday', translation: 'día de pago', meaning: 'the day your salary arrives', sentence: 'Payday is the last Friday.', icon: 'spiral-calendar' },
      { id: 'pd-wage', word: 'wage', translation: 'salario', meaning: 'money paid for hours worked', sentence: 'The hourly wage went up.', icon: 'money-bag' },
      { id: 'pd-gross', word: 'gross pay', translation: 'salario bruto', meaning: 'what you earn before deductions', sentence: 'Gross pay is not what arrives.', icon: 'chart-increasing' },
      { id: 'pd-net', word: 'net pay', translation: 'salario neto', meaning: 'what actually reaches your account', sentence: 'Net pay is what matters.', icon: 'credit-card' },
      { id: 'pd-tax', word: 'tax', translation: 'impuesto', meaning: 'money taken by the state', sentence: 'Tax takes a third of it.', icon: 'bank' },
      { id: 'pd-deduction', word: 'deduction', translation: 'retención', meaning: 'an amount taken off before you are paid', sentence: 'Check the deductions on the payslip.', icon: 'chart-decreasing' },
      { id: 'pd-transfer-2', word: 'bank transfer', translation: 'transferencia', meaning: 'money moved between accounts', sentence: 'The bank transfer arrived late.', icon: 'bank' },
      { id: 'pd-savings', word: 'savings', translation: 'ahorros', meaning: 'money kept rather than spent', sentence: 'Put something into savings first.', icon: 'money-bag' },
      { id: 'pd-budget', word: 'budget', translation: 'presupuesto', meaning: 'a plan for what to spend', sentence: 'The budget is tight this month.', icon: 'abacus' },
      { id: 'pd-expenses', word: 'expenses', translation: 'gastos', meaning: 'money you had to spend for work', sentence: 'Claim the expenses before the tenth.', icon: 'receipt' },
    ],
  },
  {
    id: 'borrowing',
    title: 'Loans & Banking',
    icon: 'bank',
    words: [
      { id: 'bo-loan', word: 'loan', translation: 'préstamo', meaning: 'money borrowed and paid back', sentence: 'The loan runs for five years.', icon: 'bank' },
      { id: 'bo-interest', word: 'interest', translation: 'interés', meaning: 'what borrowing costs you', sentence: 'The interest is fixed.', icon: 'chart-increasing' },
      { id: 'bo-instalment', word: 'instalment', translation: 'cuota', meaning: 'one of the regular payments', sentence: 'The first instalment is in March.', icon: 'spiral-calendar' },
      { id: 'bo-mortgage', word: 'mortgage', translation: 'hipoteca', meaning: 'a loan to buy a home', sentence: 'The mortgage took twenty years.', icon: 'house-with-garden' },
      { id: 'bo-deposit', word: 'deposit', translation: 'entrada', meaning: 'the money paid up front', sentence: 'They asked for a bigger deposit.', icon: 'money-bag' },
      { id: 'bo-debt', word: 'debt', translation: 'deuda', meaning: 'money you still owe', sentence: 'He paid off the debt early.', icon: 'chart-decreasing' },
      { id: 'bo-credit-score', word: 'credit history', translation: 'historial crediticio', meaning: 'the record of how you repay', sentence: 'Her credit history is spotless.', icon: 'ledger' },
      { id: 'bo-overdraft', word: 'overdraft', translation: 'descubierto', meaning: 'spending below zero in an account', sentence: 'The overdraft charges are high.', icon: 'red-exclamation-mark' },
      { id: 'bo-statement', word: 'bank statement', translation: 'extracto bancario', meaning: 'the list of what moved in and out', sentence: 'The bank statement shows it twice.', icon: 'page-facing-up' },
      { id: 'bo-borrow-2', word: 'pay back', translation: 'devolver', meaning: 'to return money you borrowed', sentence: 'I will pay you back on Friday.', icon: 'left-arrow' },
    ],
  },
]
