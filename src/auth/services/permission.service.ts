import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

// Mapa estático temporal
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['manage:settings', 'manage:employees', 'view:reports', 'book:create', 'book:edit', 'book:delete'],
  EMPLOYEE: ['view:calendar', 'book:create', 'book:edit'],
};

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve permissions for a role
   */
  async getPermissionsForRole(role: string, tenantId: string): Promise<string[]> {
    return ROLE_PERMISSIONS[role] || [];

    /*
        const dbPermissions = await this.prisma.tenantPermission.findMany({
        where: { tenantId, roleName: role },
        select: { action: true }
        });
        return dbPermissions.map(p => p.action);
    */
  }
}
