import { readFileSync, writeFileSync } from 'fs';

const path = 'src/modules/professionals/professionals.module.ts';
let code = readFileSync(path, 'utf8');

if (!code.includes("WorkingHoursController")) {
  code = code.replace(
    "import { ProfessionalsController } from './professionals.controller';",
    "import { ProfessionalsController } from './professionals.controller';\nimport { WorkingHoursController } from './features/working-hours/working-hours.controller';"
  );
  code = code.replace(
    "controllers: [ProfessionalsController],",
    "controllers: [ProfessionalsController, WorkingHoursController],"
  );
  writeFileSync(path, code);
}
