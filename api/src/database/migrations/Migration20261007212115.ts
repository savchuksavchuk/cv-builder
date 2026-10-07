import { Migration } from '@mikro-orm/migrations';

export class Migration20261007212115 extends Migration {
  override name = 'Migration20261007212115';

  override up(): void | Promise<void> {
    this.addSql(
      `update "cvs" set "status" = 'completed' where "status" = 'ready';`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `update "cvs" set "status" = 'ready' where "status" = 'completed';`,
    );
  }
}
