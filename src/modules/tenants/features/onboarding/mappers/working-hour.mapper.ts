import { DAY_OF_WEEK_TO_INT, type DayOfWeek } from 'src/common/constants/day-of-week.constants';
import { minutesToTime } from 'src/common/utils/time.util';
import type { TenantOnboardingRaw } from '../types/onboarding-raw.types';

type WorkingHourRaw = TenantOnboardingRaw['tenantWorkingHours'][number];

export interface FormattedInterval {
  opensAt: string;
  closesAt: string;
}

export interface FormattedWorkingHour {
  dayOfWeek: DayOfWeek;
  isActive: boolean;
  intervals: FormattedInterval[];
}

export interface WorkingHoursResponse {
  workingHours: FormattedWorkingHour[];
}

const ORDERED_DAYS: readonly DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export class WorkingHoursMapper {
  static toResponse(raw: WorkingHourRaw[] | { tenantWorkingHours: WorkingHourRaw[] }): WorkingHoursResponse {
    const list = Array.isArray(raw) ? raw : raw.tenantWorkingHours;
    return {
      workingHours: this.toResponseList(list),
    };
  }

  static toResponseList(workingHours: WorkingHourRaw[] = []): FormattedWorkingHour[] {
    return ORDERED_DAYS.map((dayOfWeek) => {
      const dayInt = DAY_OF_WEEK_TO_INT[dayOfWeek];
      const matchingIntervals = workingHours.filter((wh) => wh.dayOfWeek === dayInt).sort((a, b) => a.opensAt - b.opensAt);

      if (matchingIntervals.length === 0) {
        return {
          dayOfWeek,
          isActive: false,
          intervals: [],
        };
      }

      return {
        dayOfWeek,
        isActive: true,
        intervals: matchingIntervals.map((interval) => ({
          opensAt: minutesToTime(interval.opensAt),
          closesAt: minutesToTime(interval.closesAt),
        })),
      };
    });
  }
}
