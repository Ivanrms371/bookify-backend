import type { LocationCountry } from '../types/location.types';

// Supported markets only. Region sources and timezone compatibility notes: ../README.md.
export const LOCATION_COUNTRIES: LocationCountry[] = [
  {
    code: 'UY',
    label: 'Uruguay',
    currency: 'UYU',
    currencies: ['UYU'],
    defaultTimeZone: 'America/Montevideo',
    timeZones: ['America/Montevideo'],
    regionLabel: 'Departamento',
    regions: [
      {
        value: 'Artigas',
        label: 'Artigas',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Canelones',
        label: 'Canelones',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Cerro Largo',
        label: 'Cerro Largo',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Colonia',
        label: 'Colonia',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Durazno',
        label: 'Durazno',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Flores',
        label: 'Flores',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Florida',
        label: 'Florida',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Lavalleja',
        label: 'Lavalleja',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Maldonado',
        label: 'Maldonado',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Montevideo',
        label: 'Montevideo',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Paysandú',
        label: 'Paysandú',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Río Negro',
        label: 'Río Negro',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Rivera',
        label: 'Rivera',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Rocha',
        label: 'Rocha',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Salto',
        label: 'Salto',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'San José',
        label: 'San José',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Soriano',
        label: 'Soriano',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Tacuarembó',
        label: 'Tacuarembó',
        timeZone: 'America/Montevideo',
      },
      {
        value: 'Treinta y Tres',
        label: 'Treinta y Tres',
        timeZone: 'America/Montevideo',
      },
    ],
  },
  {
    code: 'AR',
    label: 'Argentina',
    currency: 'ARS',
    currencies: ['ARS'],
    defaultTimeZone: 'America/Argentina/Buenos_Aires',
    timeZones: [
      'America/Argentina/Buenos_Aires',
      'America/Argentina/Cordoba',
      'America/Argentina/Salta',
      'America/Argentina/Jujuy',
      'America/Argentina/Tucuman',
      'America/Argentina/Catamarca',
      'America/Argentina/La_Rioja',
      'America/Argentina/San_Juan',
      'America/Argentina/Mendoza',
      'America/Argentina/San_Luis',
      'America/Argentina/Rio_Gallegos',
      'America/Argentina/Ushuaia',
    ],
    regionLabel: 'Provincia',
    regions: [
      {
        value: 'Buenos Aires',
        label: 'Buenos Aires',
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      {
        value: 'Ciudad Autónoma de Buenos Aires',
        label: 'Ciudad Autónoma de Buenos Aires',
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      {
        value: 'Catamarca',
        label: 'Catamarca',
        timeZone: 'America/Argentina/Catamarca',
      },
      {
        value: 'Chaco',
        label: 'Chaco',
        timeZone: 'America/Argentina/Cordoba',
      },
      {
        value: 'Chubut',
        label: 'Chubut',
        timeZone: 'America/Argentina/Catamarca',
      },
      {
        value: 'Córdoba',
        label: 'Córdoba',
        timeZone: 'America/Argentina/Cordoba',
      },
      {
        value: 'Corrientes',
        label: 'Corrientes',
        timeZone: 'America/Argentina/Cordoba',
      },
      {
        value: 'Entre Ríos',
        label: 'Entre Ríos',
        timeZone: 'America/Argentina/Cordoba',
      },
      {
        value: 'Formosa',
        label: 'Formosa',
        timeZone: 'America/Argentina/Cordoba',
      },
      {
        value: 'Jujuy',
        label: 'Jujuy',
        timeZone: 'America/Argentina/Jujuy',
      },
      {
        value: 'La Pampa',
        label: 'La Pampa',
        timeZone: 'America/Argentina/Salta',
      },
      {
        value: 'La Rioja',
        label: 'La Rioja',
        timeZone: 'America/Argentina/La_Rioja',
      },
      {
        value: 'Mendoza',
        label: 'Mendoza',
        timeZone: 'America/Argentina/Mendoza',
      },
      {
        value: 'Misiones',
        label: 'Misiones',
        timeZone: 'America/Argentina/Cordoba',
      },
      {
        value: 'Neuquén',
        label: 'Neuquén',
        timeZone: 'America/Argentina/Salta',
      },
      {
        value: 'Río Negro',
        label: 'Río Negro',
        timeZone: 'America/Argentina/Salta',
      },
      {
        value: 'Salta',
        label: 'Salta',
        timeZone: 'America/Argentina/Salta',
      },
      {
        value: 'San Juan',
        label: 'San Juan',
        timeZone: 'America/Argentina/San_Juan',
      },
      {
        value: 'San Luis',
        label: 'San Luis',
        timeZone: 'America/Argentina/San_Luis',
      },
      {
        value: 'Santa Cruz',
        label: 'Santa Cruz',
        timeZone: 'America/Argentina/Rio_Gallegos',
      },
      {
        value: 'Santa Fe',
        label: 'Santa Fe',
        timeZone: 'America/Argentina/Cordoba',
      },
      {
        value: 'Santiago del Estero',
        label: 'Santiago del Estero',
        timeZone: 'America/Argentina/Cordoba',
      },
      {
        value: 'Tierra del Fuego',
        label: 'Tierra del Fuego',
        timeZone: 'America/Argentina/Ushuaia',
      },
      {
        value: 'Tucumán',
        label: 'Tucumán',
        timeZone: 'America/Argentina/Tucuman',
      },
    ],
  },
  {
    code: 'PE',
    label: 'Perú',
    currency: 'PEN',
    currencies: ['PEN'],
    defaultTimeZone: 'America/Lima',
    timeZones: ['America/Lima'],
    regionLabel: 'Departamento',
    regions: [
      {
        value: 'Amazonas',
        label: 'Amazonas',
        timeZone: 'America/Lima',
      },
      {
        value: 'Áncash',
        label: 'Áncash',
        timeZone: 'America/Lima',
      },
      {
        value: 'Apurímac',
        label: 'Apurímac',
        timeZone: 'America/Lima',
      },
      {
        value: 'Arequipa',
        label: 'Arequipa',
        timeZone: 'America/Lima',
      },
      {
        value: 'Ayacucho',
        label: 'Ayacucho',
        timeZone: 'America/Lima',
      },
      {
        value: 'Cajamarca',
        label: 'Cajamarca',
        timeZone: 'America/Lima',
      },
      {
        value: 'Callao',
        label: 'Callao',
        timeZone: 'America/Lima',
      },
      {
        value: 'Cusco',
        label: 'Cusco',
        timeZone: 'America/Lima',
      },
      {
        value: 'Huancavelica',
        label: 'Huancavelica',
        timeZone: 'America/Lima',
      },
      {
        value: 'Huánuco',
        label: 'Huánuco',
        timeZone: 'America/Lima',
      },
      {
        value: 'Ica',
        label: 'Ica',
        timeZone: 'America/Lima',
      },
      {
        value: 'Junín',
        label: 'Junín',
        timeZone: 'America/Lima',
      },
      {
        value: 'La Libertad',
        label: 'La Libertad',
        timeZone: 'America/Lima',
      },
      {
        value: 'Lambayeque',
        label: 'Lambayeque',
        timeZone: 'America/Lima',
      },
      {
        value: 'Lima',
        label: 'Lima',
        timeZone: 'America/Lima',
      },
      {
        value: 'Loreto',
        label: 'Loreto',
        timeZone: 'America/Lima',
      },
      {
        value: 'Madre de Dios',
        label: 'Madre de Dios',
        timeZone: 'America/Lima',
      },
      {
        value: 'Moquegua',
        label: 'Moquegua',
        timeZone: 'America/Lima',
      },
      {
        value: 'Pasco',
        label: 'Pasco',
        timeZone: 'America/Lima',
      },
      {
        value: 'Piura',
        label: 'Piura',
        timeZone: 'America/Lima',
      },
      {
        value: 'Puno',
        label: 'Puno',
        timeZone: 'America/Lima',
      },
      {
        value: 'San Martín',
        label: 'San Martín',
        timeZone: 'America/Lima',
      },
      {
        value: 'Tacna',
        label: 'Tacna',
        timeZone: 'America/Lima',
      },
      {
        value: 'Tumbes',
        label: 'Tumbes',
        timeZone: 'America/Lima',
      },
      {
        value: 'Ucayali',
        label: 'Ucayali',
        timeZone: 'America/Lima',
      },
    ],
  },
  {
    code: 'CL',
    label: 'Chile',
    currency: 'CLP',
    currencies: ['CLP'],
    defaultTimeZone: 'America/Santiago',
    timeZones: ['America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter'],
    regionLabel: 'Región',
    regions: [
      {
        value: 'Arica y Parinacota',
        label: 'Arica y Parinacota',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Tarapacá',
        label: 'Tarapacá',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Antofagasta',
        label: 'Antofagasta',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Atacama',
        label: 'Atacama',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Coquimbo',
        label: 'Coquimbo',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Valparaíso',
        label: 'Valparaíso',
        timeZone: '',
      },
      {
        value: 'Metropolitana de Santiago',
        label: 'Metropolitana de Santiago',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Libertador General Bernardo O’Higgins',
        label: 'Libertador General Bernardo O’Higgins',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Maule',
        label: 'Maule',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Ñuble',
        label: 'Ñuble',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Biobío',
        label: 'Biobío',
        timeZone: 'America/Santiago',
      },
      {
        value: 'La Araucanía',
        label: 'La Araucanía',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Los Ríos',
        label: 'Los Ríos',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Los Lagos',
        label: 'Los Lagos',
        timeZone: 'America/Santiago',
      },
      {
        value: 'Aysén del General Carlos Ibáñez del Campo',
        label: 'Aysén del General Carlos Ibáñez del Campo',
        timeZone: 'America/Punta_Arenas',
      },
      {
        value: 'Magallanes y de la Antártica Chilena',
        label: 'Magallanes y de la Antártica Chilena',
        timeZone: 'America/Punta_Arenas',
      },
    ],
  },
  {
    code: 'PY',
    label: 'Paraguay',
    currency: 'PYG',
    currencies: ['PYG'],
    defaultTimeZone: 'America/Asuncion',
    timeZones: ['America/Asuncion'],
    regionLabel: 'Departamento',
    regions: [
      {
        value: 'Asunción',
        label: 'Asunción',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Concepción',
        label: 'Concepción',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'San Pedro',
        label: 'San Pedro',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Cordillera',
        label: 'Cordillera',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Guairá',
        label: 'Guairá',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Caaguazú',
        label: 'Caaguazú',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Caazapá',
        label: 'Caazapá',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Itapúa',
        label: 'Itapúa',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Misiones',
        label: 'Misiones',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Paraguarí',
        label: 'Paraguarí',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Alto Paraná',
        label: 'Alto Paraná',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Central',
        label: 'Central',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Ñeembucú',
        label: 'Ñeembucú',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Amambay',
        label: 'Amambay',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Canindeyú',
        label: 'Canindeyú',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Presidente Hayes',
        label: 'Presidente Hayes',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Boquerón',
        label: 'Boquerón',
        timeZone: 'America/Asuncion',
      },
      {
        value: 'Alto Paraguay',
        label: 'Alto Paraguay',
        timeZone: 'America/Asuncion',
      },
    ],
  },
];
