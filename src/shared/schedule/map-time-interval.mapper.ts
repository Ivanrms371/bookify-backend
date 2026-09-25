import { Interval } from 'src/common/types/schedule.types';
import { timeToMinutes } from 'src/common/utils/time.util';
import { TimeIntervalDto } from './interval-dto';

export const mapTimeInterval = (interval: TimeIntervalDto): Interval => ({
  opensAt: timeToMinutes(interval.opensAt),
  closesAt: timeToMinutes(interval.closesAt),
});

export const mapTimeIntervals = (intervals: TimeIntervalDto[]): Interval[] => {
  return intervals.map(mapTimeInterval);
};
