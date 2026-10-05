import type { MembershipRole } from 'src/generated/prisma/enums';
import type { InvitationManagementDto } from '../../invitations/dto/invitation-management.dto';

export interface TeamMemberDto {
  id: string;
  userId: string;
  role: MembershipRole;
  isActive: boolean;
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
  professional: { id: string; name: string; avatarUrl: string | null; colorTheme: string | null } | null;
}
export interface TeamResponseDto {
  members: TeamMemberDto[];
  invitations: InvitationManagementDto[];
}
