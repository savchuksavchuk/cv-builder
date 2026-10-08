import { Migration } from '@mikro-orm/migrations';

export class Migration20261007202559 extends Migration {
  override name = 'Migration20261007202559';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "cvs" add "compose_regenerations" int not null default 0, add "compose_feedback" jsonb not null default '[]';`,
    );
    this.addSql(`alter table "cvs" rename column "summary" to "document";`);
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "cvs" drop column "compose_regenerations", drop column "compose_feedback";`,
    );
    this.addSql(`alter table "cvs" rename column "document" to "summary";`);
  }
}
