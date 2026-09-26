import { readFileSync, writeFileSync } from 'fs';

const path = 'src/modules/professionals/professionals.controller.ts';
let code = readFileSync(path, 'utf8');

code = code.replace(
  "@Permissions(PERMISSIONS.PROFESSIONAL_UPDATE)\n  @Put('me/profile')",
  "@Permissions(PERMISSIONS.PROFESSIONAL_UPDATE_SELF)\n  @Put('me/profile')"
);

const newMethods = `
  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE_SELF)
  @Post('me/services/:serviceId')
  async addMyService(
    @GetTenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('serviceId') serviceId: string,
  ) {
    const prof = await this.professionalsService.findByUserId(tenantId, userId);
    return this.professionalsService.addService({ professionalId: prof.id, serviceId, tenantId });
  }

  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE_SELF)
  @Delete('me/services/:serviceId')
  async deleteMyService(
    @GetTenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('serviceId') serviceId: string,
  ) {
    const prof = await this.professionalsService.findByUserId(tenantId, userId);
    return this.professionalsService.removeService({ professionalId: prof.id, serviceId, tenantId });
  }
`;

if (!code.includes("addMyService")) {
  code = code.replace("  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE)\n  @Put(':id')", newMethods + "\n  @Permissions(PERMISSIONS.PROFESSIONAL_UPDATE)\n  @Put(':id')");
  writeFileSync(path, code);
}
