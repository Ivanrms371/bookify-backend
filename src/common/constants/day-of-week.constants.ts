export const DAY_OF_WEEK_TO_INT = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
} as const;

export const DAY_OF_WEEK_VALUES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export type DayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number];

export const INT_TO_DAY_OF_WEEK = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
} as const;

export type DayOfWeekNumber = keyof typeof INT_TO_DAY_OF_WEEK;
