export class TeamMapper {
  static toTeamMemberDto(member: any) {
    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      isActive: member.isActive,
      user: member.user ? {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl,
      } : null,
      professional: member.user?.professional ? {
        id: member.user.professional.id,
        name: member.user.professional.name,
        avatarUrl: member.user.professional.avatarUrl,
        colorTheme: member.user.professional.colorTheme,
      } : null,
    };
  }

  static toPendingInvitationDto(invitation: any) {
    return {
      id: invitation.id,
      name: invitation.professional?.name || invitation.email,
      email: invitation.email,
      role: invitation.role,
      status: 'PENDING',
      expiresAt: invitation.expiresAt,
    };
  }
}
