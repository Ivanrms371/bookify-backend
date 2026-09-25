import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePublicParams } from './appointments.types';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CustomersService } from 'src/modules/customers/customers.service';
import { ProfessionalsService } from 'src/modules/professionals/professionals.service';
import { ServicesService } from 'src/modules/services/services.service';
import { AvailabilityService } from 'src/modules/availability/availability.service';
import { addMinutes, parseISO } from 'date-fns';
import { AppointmentStatus } from 'src/generated/prisma/enums';
import { randomBytes } from 'crypto';
import { FindAllAppointmentsParamsDto } from './dto/find-all-appointments.dto';

import { AppointmentsMapper } from './mappers/appointments.mapper';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly availabilityService: AvailabilityService,
    private readonly customersService: CustomersService,
    private readonly professionalsService: ProfessionalsService,
    private readonly servicesService: ServicesService,
  ) {}

  async findAll(tenantId: string, params: FindAllAppointmentsParamsDto) {
    const { data, meta } = await this.appointmentsRepository.findMany(tenantId, params);

    return {
      data: AppointmentsMapper.toResponseList(data),
      meta,
    };
  }

  async findById(id: string) {}

  async create(tenantId: string, dto: CreateAppointmentDto) {
    const { customerId, professionalId, serviceId } = dto;

    const [customer, professional, service] = await Promise.all([
      customerId ? this.customersService.findById(tenantId, customerId) : null,
      this.professionalsService.findById(tenantId, professionalId),
      this.servicesService.findByIdAndProfessional(tenantId, serviceId, professionalId),
    ]);

    if (customerId && !customer) {
      throw new NotFoundException('No hemos encontrado al cliente.');
    }

    if (!professional) {
      throw new NotFoundException('No hemos encontrado al profesional.');
    }

    if (!service) {
      throw new NotFoundException('No hemos encontrado el servicio.');
    }

    const startsAt = parseISO(dto.startsAt);
    const endsAt = addMinutes(startsAt, service.durationMinutes);

    const manageToken = randomBytes(32).toString('hex');

    const isAvailable = await this.availabilityService.isSlotAvailable({
      tenantId,
      professionalId,
      serviceId,
      startsAt: dto.startsAt,
      ignoreMinAdvanced: true,
    });

    if (!isAvailable) {
      throw new BadRequestException('El horario seleccionado ya no está disponible.');
    }

    const appointment = await this.appointmentsRepository.create({
      tenant: { connect: { id: tenantId } },
      professional: { connect: { id: professionalId } },
      service: { connect: { id: serviceId } },

      startsAt,
      endsAt,
      manageToken,
      status: AppointmentStatus.PENDING,
      durationMinutes: service.durationMinutes,
      price: service.price,

      ...(customer && {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phoneNumber,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      }),

      blocks: {
        create: {
          startsAt,
          endsAt,
        },
      },
    });

    return appointment;
  }

  async reschedule(tenantId: string, dto: any) {}

  async cancel(tenantId: string, dto: any) {}
}
