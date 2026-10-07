import { Migration } from '@mikro-orm/migrations';

export class Migration20261007174424 extends Migration {
  override name = 'Migration20261007174424';

  override up(): void | Promise<void> {
    this.addSql(`alter table "cvs" add "source_file_key" varchar(255) null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "cvs" drop column "source_file_key";`);
  }
}
