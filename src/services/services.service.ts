import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../typeORM/entities/service.entity';
import { User } from '../typeORM/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ResponseService } from '../response-service/response-service.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private responseService: ResponseService,
  ) {}

  async create(userId: number, dto: CreateServiceDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const service = this.serviceRepo.create({
      ...dto,
      user,
    });

    const savedService = await this.serviceRepo.save(service);

    return this.responseService.success(
      'Service created successfully',
      savedService,
    );
  }

  async findByUser(userId: number) {
    const services = await this.serviceRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    return this.responseService.success(
      'Services retrieved successfully',
      services,
    );
  }

  async findOne(id: number) {
    const service = await this.serviceRepo.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.responseService.success(
      'Service retrieved successfully',
      service,
    );
  }

  async update(id: number, userId: number, dto: UpdateServiceDto) {
    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.user.id !== userId) {
      throw new ForbiddenException('You can only update your own services');
    }

    Object.assign(service, dto);
    const updatedService = await this.serviceRepo.save(service);

    return this.responseService.success(
      'Service updated successfully',
      updatedService,
    );
  }

  async remove(id: number, userId: number) {
    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own services');
    }

    await this.serviceRepo.remove(service);

    return this.responseService.success(
      'Service deleted successfully',
      null,
    );
  }
}
