import { readFileSync, writeFileSync } from 'fs';

// 1. permissions.constant.ts
let path = 'src/common/security/constants/permissions.constant.ts';
let code = readFileSync(path, 'utf8');

if (!code.includes("SCHEDULE_EXCEPTION_UPDATE")) {
  code = code.replace(
    "SCHEDULE_UPDATE: 'schedule:update',",
    "SCHEDULE_UPDATE: 'schedule:update',\n  SCHEDULE_UPDATE_SELF: 'schedule:update_self',\n  SCHEDULE_EXCEPTION_UPDATE: 'schedule_exception:update',"
  );
  code = code.replace(
    "PROFESSIONAL_UPDATE: 'professional:update',",
    "PROFESSIONAL_UPDATE: 'professional:update',\n  PROFESSIONAL_UPDATE_SELF: 'professional:update_self',"
  );
  writeFileSync(path, code);
}

// 2. role-permissions.constants.ts
path = 'src/common/security/constants/role-permissions.constants.ts';
code = readFileSync(path, 'utf8');

if (!code.includes("PERMISSIONS.SCHEDULE_EXCEPTION_UPDATE")) {
  // OWNER
  code = code.replace(
    "PERMISSIONS.SCHEDULE_UPDATE,\n\n    PERMISSIONS.CUSTOMER_READ",
    "PERMISSIONS.SCHEDULE_UPDATE,\n    PERMISSIONS.SCHEDULE_EXCEPTION_UPDATE,\n\n    PERMISSIONS.CUSTOMER_READ"
  );
  // ADMIN
  code = code.replace(
    /PERMISSIONS\.SCHEDULE_UPDATE,\n\n    PERMISSIONS\.CUSTOMER_READ/g,
    "PERMISSIONS.SCHEDULE_UPDATE,\n    PERMISSIONS.SCHEDULE_EXCEPTION_UPDATE,\n\n    PERMISSIONS.CUSTOMER_READ"
  );
  
  // STAFF
  code = code.replace(
    "PERMISSIONS.SCHEDULE_READ,\n\n    PERMISSIONS.CUSTOMER_READ",
    "PERMISSIONS.SCHEDULE_READ,\n    PERMISSIONS.SCHEDULE_UPDATE_SELF,\n\n    PERMISSIONS.CUSTOMER_READ"
  );
  code = code.replace(
    "PERMISSIONS.PROFESSIONAL_READ,\n\n    PERMISSIONS.SERVICE_READ",
    "PERMISSIONS.PROFESSIONAL_READ,\n    PERMISSIONS.PROFESSIONAL_UPDATE_SELF,\n\n    PERMISSIONS.SERVICE_READ"
  );
  
  writeFileSync(path, code);
}
