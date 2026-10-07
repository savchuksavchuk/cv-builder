import { Migration } from '@mikro-orm/migrations';

export class Migration20261007163519 extends Migration {
  override name = 'Migration20261007163519';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "cvs" add "question_rounds" int not null default 0;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "cvs" drop column "question_rounds";`);
  }
}
