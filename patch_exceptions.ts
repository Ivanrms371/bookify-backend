import { readFileSync, writeFileSync } from 'fs';

const path = 'src/modules/schedule/exceptions/schedule-exception.controller.ts';
let code = readFileSync(path, 'utf8');

code = code.replace(/@Permissions\(PERMISSIONS\.SCHEDULE_UPDATE\)/g, "@Permissions(PERMISSIONS.SCHEDULE_EXCEPTION_UPDATE)");

writeFileSync(path, code);
