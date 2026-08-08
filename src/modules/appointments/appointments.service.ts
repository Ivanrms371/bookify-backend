import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CustomersService } from 'src/modules/customers/customers.service';
import { ProfessionalsService } from 'src/modules/professional/professionals.service';
import { ServicesService } from 'src/modules/services/services.service';
import { AvailabilityService } from 'src/modules/availability/availability.service';
import { addMinutes, parseISO } from 'date-fns';
import { AppointmentStatus } from 'src/generated/prisma/enums';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { FindAllAppointmentsParamsDto } from './dto/find-all-appointments.dto';

import { AppointmentsMapper } from './mappers/appointments.mapper';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
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
    const { customerId, professionalId, serviceId, date, time } = dto;

    const [customer, professional, service] = await Promise.all([
      this.customersService.findById(tenantId, customerId),
      this.professionalsService.findById(tenantId, professionalId),
      this.servicesService.findById(tenantId, serviceId),
    ]);

    if (!customer) {
      throw new NotFoundException('No hemos encontrado al cliente.');
    }

    if (!professional) {
      throw new NotFoundException('No hemos encontrado al profesional.');
    }

    if (!service) {
      throw new NotFoundException('No hemos encontrado el servicio.');
    }

    const startsAt = new Date(`${date}T${time}:00`);
    const endsAt = addMinutes(startsAt, service.durationMinutes);

    const isAvailable = await this.availabilityService.checkAvailability(tenantId, professionalId, startsAt, endsAt);

    if (!isAvailable) {
      throw new ConflictException('El horario seleccionado ya no está disponible');
    }

    const manageToken = randomBytes(32).toString('hex');

    const appointment = await this.appointmentsRepository.create({
      tenant: { connect: { id: tenantId } },
      professional: { connect: { id: professionalId } },
      customer: { connect: { id: customerId } },
      service: { connect: { id: serviceId } },
      startsAt,
      endsAt,
      manageToken,
      status: AppointmentStatus.PENDING,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      durationMinutes: service.durationMinutes,
      price: service.price,
      blocks: {
        create: {
          startsAt,
          endsAt,
        },
      },
    });

    console.log(appointment);
  }
}
