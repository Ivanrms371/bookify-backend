import { v5 as uuidv5 } from 'uuid';
import { formatWorkingHoursForBackend } from '../../src/shared/schedule/schedule.utils';
import { DayOfWeek } from '../../src/shared/schedule/schedule.types';

// Stable IDs are necessary only for fixture ownership/reconciliation, not for bookings.
export const fixtureId = (key: string) => uuidv5(`bookify:development:v1:${key}`, uuidv5.URL);
export const TENANT_ID = fixtureId('tenant');
export const SLUG = 'brisa-estudio-demo';
export const SEED_MARKER = '[bookify-dev-seed:v1]';
export const DEVELOPMENT_PASSWORD = 'BrisaDemo!2026';
export const TIME_ZONE = 'America/Montevideo';

const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
function hours(dayNumbers: number[], morning: [string, string], afternoon: [string, string]) {
  return formatWorkingHoursForBackend(
    dayNumbers.map((day) => ({
      day: days[day],
      intervals: [
        { opens: morning[0], closes: morning[1] },
        { opens: afternoon[0], closes: afternoon[1] },
      ],
    })),
  );
}
export const TENANT_HOURS = [
  ...hours([1, 2, 3, 4, 5], ['09:00', '13:00'], ['14:00', '19:00']),
  ...hours([6], ['09:00', '13:00'], ['14:00', '18:00']),
  ...hours([0], ['10:00', '13:00'], ['14:00', '18:00']),
];
export const SERVICES = [
  { key: 'cut', name: 'Corte y terminación', durationMinutes: 45, price: 850, description: 'Corte personalizado, lavado y terminación.' },
  { key: 'beard', name: 'Perfilado de barba', durationMinutes: 30, price: 550, description: 'Perfilado y cuidado de barba.' },
  { key: 'cut-beard', name: 'Corte y barba', durationMinutes: 60, price: 1200, description: 'Corte completo y perfilado de barba.' },
  { key: 'color', name: 'Coloración', durationMinutes: 90, price: 2400, description: 'Coloración y acabado con asesoramiento previo.' },
  { key: 'styling', name: 'Peinado', durationMinutes: 30, price: 700, description: 'Peinado para ocasiones especiales.' },
  { key: 'treatment', name: 'Tratamiento capilar', durationMinutes: 60, price: 1500, description: 'Hidratación y cuidado del cabello.' },
].map((service, displayOrder) => ({ ...service, id: fixtureId(`service:${service.key}`), displayOrder }));
export const PROFESSIONALS = [
  {
    key: 'mateo',
    name: 'Mateo Silva',
    email: 'mateo.brisa@example.com',
    phoneNumber: '90000101',
    colorTheme: '#2563eb',
    profession: 'Barbero y estilista',
    bio: 'Cortes clásicos, terminaciones y cuidado de barba.',
    services: ['cut', 'beard', 'cut-beard'],
    hours: TENANT_HOURS.filter((h) => h.dayOfWeek !== 0),
  },
  {
    key: 'santiago',
    name: 'Santiago Pereira',
    email: 'santiago.brisa@example.com',
    phoneNumber: '90000102',
    colorTheme: '#16a34a',
    profession: 'Barbero',
    bio: 'Cortes modernos y perfilado de barba.',
    services: ['cut', 'beard', 'cut-beard'],
    hours: TENANT_HOURS.filter((h) => h.dayOfWeek !== 1),
  },
  {
    key: 'lucia',
    name: 'Lucía Méndez',
    email: 'lucia.brisa@example.com',
    phoneNumber: '90000103',
    colorTheme: '#9333ea',
    profession: 'Colorista y estilista',
    bio: 'Coloración, peinados y tratamientos capilares.',
    services: ['cut', 'color', 'styling', 'treatment'],
    hours: [...hours([1, 2, 3, 5], ['10:00', '13:00'], ['14:00', '18:00']), ...hours([0, 6], ['10:00', '13:00'], ['14:00', '17:00'])],
  },
].map((professional) => ({
  ...professional,
  id: fixtureId(`professional:${professional.key}`),
  userId: fixtureId(`user:${professional.key}`),
}));

const firstNames = [
  'Valentina',
  'Joaquín',
  'Camila',
  'Nicolás',
  'Florencia',
  'Agustín',
  'Martina',
  'Federico',
  'Sofía',
  'Diego',
  'Victoria',
  'Bruno',
  'Catalina',
  'Gabriel',
  'Emilia',
  'Andrés',
  'Julieta',
  'Sebastián',
  'Renata',
  'Pablo',
];
const surnames = [
  'Acosta',
  'Cabrera',
  'Fernández',
  'Giménez',
  'López',
  'Morales',
  'Olivera',
  'Pereira',
  'Rodríguez',
  'Suárez',
  'Varela',
  'Duarte',
  'Medina',
  'Romero',
  'Sosa',
  'Almeida',
  'Castro',
  'Molina',
  'Ramos',
  'Vega',
];
export const CUSTOMERS = Array.from({ length: 60 }, (_, i) => ({
  id: fixtureId(`customer:${i}`),
  name: `${firstNames[i % 20]} ${surnames[(i + Math.floor(i / 20) * 7) % 20]}`,
  phoneNumber: `90001${String(i).padStart(3, '0')}`,
  email: `brisa.${firstNames[i % 20]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()}.${i + 1}@example.com`,
  ...(i % 9 === 0 ? { notes: 'Prefiere una terminación natural.' } : {}),
}));
