import type { Chapter } from '../types'

export const ADJECTIVE_CHAPTERS_2: Omit<Chapter, 'group'>[] = [
  {
    id: 'adjectives-texture',
    title: 'Adjectives: Texture & Shape',
    icon: 'gem-stone',
    words: [
      { id: 'a2-smooth', word: 'smooth', translation: 'liso', meaning: 'with no bumps', sentence: 'The stone is smooth.', icon: 'gem-stone' },
      { id: 'a2-rough', word: 'rough', translation: 'áspero', meaning: 'not smooth to touch', sentence: 'The wood is still rough.', icon: 'wood' },
      { id: 'a2-round', word: 'round', translation: 'redondo', meaning: 'shaped like a circle', sentence: 'The table is round.', icon: 'red-circle' },
      { id: 'a2-square-shape', word: 'square', translation: 'cuadrado', meaning: 'with four equal sides', sentence: 'Cut it into square pieces.', icon: 'blue-square' },
      { id: 'a2-flat', word: 'flat', translation: 'plano', meaning: 'level, with no bumps', sentence: 'Find a flat surface.', icon: 'straight-ruler' },
      { id: 'a2-sticky', word: 'sticky', translation: 'pegajoso', meaning: 'holding to what it touches', sentence: 'My hands are sticky.', icon: 'honey-pot' },
      { id: 'a2-shiny', word: 'shiny', translation: 'brillante', meaning: 'reflecting light', sentence: 'The car is shiny again.', icon: 'sparkles' },
      { id: 'a2-transparent', word: 'transparent', translation: 'transparente', meaning: 'you can see through it', sentence: 'The lid is transparent.', icon: 'tumbler-glass' },
      { id: 'a2-hollow', word: 'hollow', translation: 'hueco', meaning: 'empty inside', sentence: 'The tree is hollow.', icon: 'deciduous-tree' },
      { id: 'a2-pointed', word: 'sharp-edged', translation: 'puntiagudo', meaning: 'coming to a point', sentence: 'That rock is sharp-edged.', icon: 'triangular-ruler' },
    ],
  },
  {
    id: 'adjectives-frequency',
    title: 'How Often',
    icon: 'counterclockwise-arrows-button',
    words: [
      { id: 'a2-always', word: 'always', translation: 'siempre', meaning: 'every single time', sentence: 'She always arrives early.', icon: 'counterclockwise-arrows-button' },
      { id: 'a2-usually', word: 'usually', translation: 'normalmente', meaning: 'most of the time', sentence: 'I usually work from home.', icon: 'house-with-garden' },
      { id: 'a2-often', word: 'often', translation: 'a menudo', meaning: 'many times', sentence: 'We often eat late.', icon: 'fork-and-knife-with-plate' },
      { id: 'a2-sometimes', word: 'sometimes', translation: 'a veces', meaning: 'now and then', sentence: 'Sometimes the train is early.', icon: 'train' },
      { id: 'a2-rarely', word: 'rarely', translation: 'rara vez', meaning: 'almost never', sentence: 'He rarely complains.', icon: 'crescent-moon' },
      { id: 'a2-never', word: 'never', translation: 'nunca', meaning: 'not once', sentence: 'I never drink coffee at night.', icon: 'cross-mark' },
      { id: 'a2-daily', word: 'daily', translation: 'a diario', meaning: 'every day', sentence: 'The backup runs daily.', icon: 'spiral-calendar' },
      { id: 'a2-weekly', word: 'weekly', translation: 'semanal', meaning: 'once a week', sentence: 'We have a weekly meeting.', icon: 'calendar' },
      { id: 'a2-occasionally', word: 'occasionally', translation: 'de vez en cuando', meaning: 'not regularly', sentence: 'He occasionally works Saturdays.', icon: 'hourglass-done' },
      { id: 'a2-constantly', word: 'constantly', translation: 'constantemente', meaning: 'without stopping', sentence: 'The phone rings constantly.', icon: 'bell' },
    ],
  },
]
