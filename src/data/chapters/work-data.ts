import type { Chapter } from '../types'

export const WORK_DATA_CHAPTERS: Omit<Chapter, 'group'>[] = [
  {
    id: 'data-security-4',
    title: 'Data & Security 4',
    icon: 'bar-chart',
    words: [
      { id: 'ds4-average', word: 'average', translation: 'media', meaning: 'the total divided by the count', sentence: 'The average hides the outliers.', icon: 'abacus' },
      { id: 'ds4-median', word: 'median', translation: 'mediana', meaning: 'the middle value', sentence: 'Use the median, not the average.', icon: 'straight-ruler' },
      { id: 'ds4-percentile', word: 'percentile', translation: 'percentil', meaning: 'the value below which a share falls', sentence: 'Latency at the ninety-fifth percentile.', icon: 'bar-chart' },
      { id: 'ds4-sample', word: 'sample', translation: 'muestra', meaning: 'a small part used to judge the whole', sentence: 'The sample was too small.', icon: 'test-tube' },
      { id: 'ds4-bias', word: 'bias', translation: 'sesgo', meaning: 'a consistent lean in the data', sentence: 'There is bias in how we collected it.', icon: 'balance-scale' },
      { id: 'ds4-correlation', word: 'correlation', translation: 'correlación', meaning: 'two things moving together', sentence: 'Correlation is not a cause.', icon: 'chart-increasing' },
      { id: 'ds4-baseline-2', word: 'benchmark', translation: 'referencia', meaning: 'a standard to measure against', sentence: 'We beat the benchmark twice.', icon: 'trophy' },
      { id: 'ds4-forecast', word: 'forecast', translation: 'previsión', meaning: 'an estimate of what comes next', sentence: 'The forecast was badly wrong.', icon: 'crystal-ball' },
      { id: 'ds4-breakdown', word: 'breakdown', translation: 'desglose', meaning: 'the numbers split into parts', sentence: 'Send the breakdown by region.', icon: 'card-index-dividers' },
      { id: 'ds4-insight', word: 'insight', translation: 'hallazgo', meaning: 'something useful the data revealed', sentence: 'That chart gave us one real insight.', icon: 'light-bulb' },
    ],
  },
  {
    id: 'data-security-5',
    title: 'Data & Security 5',
    icon: 'bar-chart',
    words: [
      { id: 'ds5-track', word: 'track', translation: 'seguir', meaning: 'to record something over time', sentence: 'We track that weekly.', icon: 'footprints' },
      { id: 'ds5-measure', word: 'measure', translation: 'medir', meaning: 'to put a number on something', sentence: 'Measure it before you change it.', icon: 'straight-ruler' },
      { id: 'ds5-target', word: 'target', translation: 'objetivo', meaning: 'the number you are aiming for', sentence: 'We missed the target by two points.', icon: 'bow-and-arrow' },
      { id: 'ds5-growth', word: 'growth rate', translation: 'tasa de crecimiento', meaning: 'how fast something increases', sentence: 'The growth rate slowed in June.', icon: 'seedling' },
      { id: 'ds5-drop-off', word: 'drop-off', translation: 'abandono', meaning: 'where people stop and leave', sentence: 'The drop-off is on the second screen.', icon: 'chart-decreasing' },
      { id: 'ds5-conversion', word: 'conversion', translation: 'conversión', meaning: 'a visitor becoming a customer', sentence: 'Conversion doubled after the change.', icon: 'chart-increasing' },
      { id: 'ds5-funnel', word: 'funnel', translation: 'embudo', meaning: 'the narrowing steps to a goal', sentence: 'The funnel leaks at checkout.', icon: 'amphora' },
      { id: 'ds5-cohort', word: 'cohort', translation: 'cohorte', meaning: 'a group tracked together over time', sentence: 'The March cohort behaved differently.', icon: 'busts-in-silhouette' },
      { id: 'ds5-ab-test', word: 'split test', translation: 'prueba A/B', meaning: 'showing two versions to compare', sentence: 'The split test ran for a fortnight.', icon: 'balance-scale' },
      { id: 'ds5-significance', word: 'significant', translation: 'significativo', meaning: 'unlikely to be chance', sentence: 'The difference is not significant.', icon: 'red-exclamation-mark' },
    ],
  },
]
