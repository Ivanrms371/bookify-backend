/// <reference types="jest" />
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TeamController } from '../team.controller';
import { TeamService } from '../team.service';
import { InvitationsController } from '../../invitations/invitations.controller';
import { InvitationsService } from '../../invitations/invitations.service';

describe('Team management resource ID validation', () => {
  let app: INestApplication;
  const team = {
    updateMember: jest.fn(),
    removeMember: jest.fn(),
    updateInvitation: jest.fn(),
    resendInvitation: jest.fn(),
    revokeInvitation: jest.fn(),
  };
  const invitations = { revoke: jest.fn() };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TeamController, InvitationsController],
      providers: [
        { provide: TeamService, useValue: team },
        { provide: InvitationsService, useValue: invitations },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    // Supply only the context normally established by guards; no live auth/database.
    app.use((req: any, _res: any, next: () => void) => {
      req.user = { id: 'manager' };
      req.tenantContext = { tenantId: 't', role: 'OWNER' };
      next();
    });
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  it.each([
    ['patch', '/api/team/members/invalid'],
    ['delete', '/api/team/members/invalid'],
    ['patch', '/api/team/invitations/invalid'],
    ['post', '/api/team/invitations/invalid/resend'],
    ['delete', '/api/team/invitations/invalid'],
    ['delete', '/api/invitations/invalid'],
  ] as const)('rejects %s %s before service access', async (method, url) => {
    await request(app.getHttpServer())[method](url).send({ role: 'STAFF' }).expect(400);
    for (const mock of [...Object.values(team), ...Object.values(invitations)]) expect(mock).not.toHaveBeenCalled();
  });
});
