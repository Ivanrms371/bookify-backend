export class InvitationCreatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly email: string,
    public readonly token: string,
    public readonly role: string,
    public readonly tenantName: string,
  ) {}
}
