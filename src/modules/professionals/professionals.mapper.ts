import { INT_TO_DAY_OF_WEEK } from 'src/common/constants/day-of-week.constants';
import { Schedule, WeeklySchedule } from 'src/common/types/schedule.types';
import { minutesToTime } from 'src/common/utils/time.util';

export class ProfessionalsMapper {
  static toDetailsDto(prof: any) {
    return {
      id: prof.id,
      userId: prof.userId,
      avatarUrl: prof.avatarUrl || '',
      avatarPublicId: prof.avatarPublicId ?? null,
      colorTheme: prof.colorTheme ?? null,
      name: prof.name || '',
      email: prof.email || '',
      phoneNumber: prof.phoneNumber || '',
      phoneCountryCode: prof.phoneCountryCode || '598',
      role: prof.user?.memberships?.[0]?.role || 'STAFF',
      bio: prof.bio || null,
      commissionType: prof.commissionType || 'PERCENTAGE',
      commissionAmount: Number(prof.commissionType === 'PERCENTAGE' ? prof.commissionPercent : prof.commissionFixed) || 0,
      assignedServices:
        prof.assignments?.map((a: any) => ({
          id: a.serviceId,
          name: a.service.name,
          isActive: a.isActive && a.service.isActive && !a.service.deletedAt,
        })) || [],
      serviceIds: prof.assignments?.map((a: any) => a.serviceId) || [],
      schedule: this.mapWorkingHoursToSchedule(prof.workingHours || []),
      slotIntervalMinutes: prof.slotIntervalMinutes,
      maxAdvancedDays: prof.maxAdvancedDays,
      minAdvancedMinutes: prof.minAdvancedMinutes,
    };
  }

  private static mapWorkingHoursToSchedule(workingHours: any[]) {
    const daysMap = new Map<string, { opensAt: string; closesAt: string }[]>();

    if (workingHours && workingHours.length > 0) {
      for (const wh of workingHours) {
        const dayName = INT_TO_DAY_OF_WEEK[wh.dayOfWeek as keyof typeof INT_TO_DAY_OF_WEEK];
        if (dayName) {
          if (!daysMap.has(dayName)) {
            daysMap.set(dayName, []);
          }
          daysMap.get(dayName)!.push({
            opensAt: minutesToTime(wh.opensAt),
            closesAt: minutesToTime(wh.closesAt),
          });
        }
      }
    }

    const workingHoursResult = Array.from(daysMap.entries()).map(([dayOfWeek, intervals]) => ({
      dayOfWeek,
      intervals,
    }));

    return { workingHours: workingHoursResult };
  }
}
