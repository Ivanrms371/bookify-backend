import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../guards/permissions.guard';
import { ROLE_PERMISSIONS } from '../constants/role-permissions.constants';
import { PERMISSIONS } from '../constants/permissions.constant';
import { CustomersController } from 'src/modules/customers/customers.controller';
import { ProfessionalsController } from 'src/modules/professionals/professionals.controller';
import { ServicesController } from 'src/modules/services/services.controller';
import { TeamController } from 'src/modules/team/team.controller';

function check(role: keyof typeof ROLE_PERMISSIONS, controller: Function, handler: Function) {
  const context = {
    getHandler: () => handler, getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ tenantContext: { permissions: ROLE_PERMISSIONS[role] } }) }),
  } as unknown as ExecutionContext;
  return new PermissionsGuard(new Reflector()).canActivate(context);
}

describe('role permissions on actual resource controller routes', () => {
  it('OWNER holds every catalog permission', () => {
    for (const permission of Object.values(PERMISSIONS)) expect(ROLE_PERMISSIONS.OWNER).toContain(permission);
  });
  it('ADMIN can update settings but cannot read or manage billing', () => {
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.TENANT_UPDATE);
    expect(ROLE_PERMISSIONS.ADMIN).not.toContain(PERMISSIONS.BILLING_READ);
    expect(ROLE_PERMISSIONS.ADMIN).not.toContain(PERMISSIONS.BILLING_MANAGE);
  });
  it('STAFF can read services and create customers', () => {
    expect(check('STAFF', ServicesController, ServicesController.prototype.findAll)).toBe(true);
    expect(check('STAFF', CustomersController, CustomersController.prototype.create)).toBe(true);
  });
  it.each([
    [TeamController, TeamController.prototype.createProfessional],
    [ProfessionalsController, ProfessionalsController.prototype.findAll],
    [ProfessionalsController, ProfessionalsController.prototype.updateStatus],
    [ServicesController, ServicesController.prototype.create],
    [CustomersController, CustomersController.prototype.update],
  ])('rejects a direct STAFF request to a management route', (controller, handler) => {
    expect(() => check('STAFF', controller, handler)).toThrow(ForbiddenException);
    expect(check('ADMIN', controller, handler)).toBe(true);
    expect(check('OWNER', controller, handler)).toBe(true);
  });
});
