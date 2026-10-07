import 'reflect-metadata';
import type { ArgumentMetadata } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ServicesController } from './services.controller';
import type { ServicesService } from './services.service';

describe('service read ID validation', () => {
  const metadata: ArgumentMetadata = { type: 'param', data: 'id', metatype: String };
  const seededId = 'f84da764-86c9-5da3-a995-762e25e69f24';
  const generatedId = '019a1234-5678-7abc-8def-0123456789ab';

  for (const method of ['findById', 'getAllProfessionals'] as const) {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, ServicesController, method);
    const idArg = Object.values(args).find((arg: any) => arg.data === 'id') as { pipes: Array<new () => { transform: (value: string, metadata: ArgumentMetadata) => Promise<string> }> };
    const pipe = new idArg.pipes[0]();

    it(`${method} accepts seeded v5 and generated v7 IDs`, async () => {
      await expect(pipe.transform(seededId, metadata)).resolves.toBe(seededId);
      await expect(pipe.transform(generatedId, metadata)).resolves.toBe(generatedId);
    });

    it(`${method} rejects malformed IDs`, async () => {
      await expect(pipe.transform('invalid-service-id', metadata)).rejects.toThrow();
    });
  }

  it('loads assigned staff with the validated ID and current tenant', async () => {
    const staff = [{ id: generatedId, name: 'Assigned professional' }];
    const service = { findAllProfessionals: jest.fn().mockResolvedValue(staff) };
    const controller = new ServicesController(service as unknown as ServicesService);
    await expect(controller.getAllProfessionals(seededId, 'current-tenant')).resolves.toEqual(staff);
    expect(service.findAllProfessionals).toHaveBeenCalledWith('current-tenant', seededId);
  });
});
