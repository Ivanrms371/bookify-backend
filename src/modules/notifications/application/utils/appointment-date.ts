import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

export function appointmentDate(startsAt: Date, timeZone: string) {
  return {
    date: formatInTimeZone(startsAt, timeZone, "dd 'de' MMMM 'de' yyyy", { locale: es }),
    time: formatInTimeZone(startsAt, timeZone, 'HH:mm'),
  };
}
