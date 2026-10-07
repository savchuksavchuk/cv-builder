import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { SaveOptions } from '../../../../common/types/save-options.type';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { UserRepository } from '../../domain/repositories/user.repository';
import { userSchema } from '../models/user.schema';

@Injectable()
export class MikroOrmUserRepository implements UserRepository {
  constructor(private readonly em: EntityManager) {}

  async findByEmail(email: Email): Promise<User | null> {
    const model = await this.em.findOne(userSchema, {
      email: email.getValue(),
    });
    return model ? userSchema.toDomain(model) : null;
  }

  async findById(id: string): Promise<User | null> {
    const model = await this.em.findOne(userSchema, { id });
    return model ? userSchema.toDomain(model) : null;
  }

  async save(user: User, options: SaveOptions = {}): Promise<void> {
    this.em.persist(this.em.create(userSchema, userSchema.fromDomain(user)));
    if (options.flush) {
      await this.em.flush();
    }
  }
}
