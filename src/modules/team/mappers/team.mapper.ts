import type { MembershipsRepository } from '../../memberships/memberships.repository';
import type { TeamMemberDto } from '../dto/team-response.dto';
export class TeamMapper {
  static toTeamMemberDto(member: Awaited<ReturnType<MembershipsRepository['findMany']>>[number], tenantId: string): TeamMemberDto {
    const profile = member.user.professional;
    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      isActive: member.isActive,
      user: { id: member.user.id, name: member.user.name, email: member.user.email, avatarUrl: member.user.avatarUrl },
      professional:
        profile?.tenantId === tenantId
          ? { id: profile.id, name: profile.name, avatarUrl: profile.avatarUrl, colorTheme: profile.colorTheme }
          : null,
    };
  }
}
