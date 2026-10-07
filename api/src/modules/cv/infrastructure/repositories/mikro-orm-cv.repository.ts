import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { SaveOptions } from '../../../../common/types/save-options.type';
import { Cv } from '../../domain/entities/cv.entity';
import { CvRepository } from '../../domain/repositories/cv.repository';
import { cvSchema } from '../models/cv.schema';

@Injectable()
export class MikroOrmCvRepository implements CvRepository {
  constructor(private readonly em: EntityManager) {}

  async findByIdForUser(id: string, userId: string): Promise<Cv | null> {
    const model = await this.em.findOne(cvSchema, { id, userId });
    return model ? cvSchema.toDomain(model) : null;
  }

  async listForUser(userId: string): Promise<Cv[]> {
    const models = await this.em.find(
      cvSchema,
      { userId },
      { orderBy: { updatedAt: 'desc' } },
    );
    return models.map((m) => cvSchema.toDomain(m));
  }

  async save(cv: Cv, options: SaveOptions = {}): Promise<void> {
    const { version, ...data } = cvSchema.fromDomain(cv);
    const existing = await this.em.findOne(cvSchema, { id: cv.id });
    if (existing) {
      await this.em.lock(existing, LockMode.OPTIMISTIC, version);
      this.em.assign(existing, data);
    } else {
      this.em.persist(this.em.create(cvSchema, { ...data, version }));
    }
    if (options.flush) {
      await this.em.flush();
    }
  }
}
