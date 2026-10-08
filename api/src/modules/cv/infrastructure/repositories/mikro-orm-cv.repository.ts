import { LockMode } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Page } from '../../../../common/types/page.type';
import { SaveOptions } from '../../../../common/types/save-options.type';
import { Cv } from '../../domain/entities/cv.entity';
import { CvRepository } from '../../domain/repositories/cv.repository';
import { CvModel, cvSchema } from '../models/cv.schema';

@Injectable()
export class MikroOrmCvRepository implements CvRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Cv | null> {
    const model = await this.em.findOne(cvSchema, { id });
    return model ? cvSchema.toDomain(model) : null;
  }

  async findByIdForUser(id: string, userId: string): Promise<Cv | null> {
    const model = await this.em.findOne(cvSchema, { id, userId });
    return model ? cvSchema.toDomain(model) : null;
  }

  async listForUser(
    userId: string,
    { offset, limit }: { offset: number; limit: number },
  ): Promise<Page<Cv>> {
    const [models, total] = await this.em.findAndCount(
      cvSchema,
      { userId },
      { orderBy: { updatedAt: 'desc', id: 'desc' }, offset, limit },
    );
    return { items: models.map((m) => cvSchema.toDomain(m)), total };
  }

  async save(cv: Cv, options: SaveOptions = {}): Promise<void> {
    const { version, ...data } = cvSchema.fromDomain(cv);
    const existing = await this.em.findOne(cvSchema, { id: cv.id });
    let model: CvModel;
    if (existing) {
      await this.em.lock(existing, LockMode.OPTIMISTIC, version);
      model = this.em.assign(existing, data);
    } else {
      model = this.em.create(cvSchema, { ...data, version });
      this.em.persist(model);
    }
    if (options.flush) {
      await this.em.flush();
      cv.version = model.version;
    }
  }
}
