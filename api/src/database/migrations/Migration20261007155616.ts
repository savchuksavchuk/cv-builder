import { Migration } from '@mikro-orm/migrations';

export class Migration20261007155616 extends Migration {
  override name = 'Migration20261007155616';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "cvs" ("id" uuid not null, "user_id" uuid not null, "target_role" varchar(120) not null, "status" varchar(255) not null, "current_step" varchar(255) null, "failure_reason" text null, "initial_user_input" text not null, "contacts" jsonb null, "summary" jsonb null, "work_experience" jsonb not null, "education" jsonb not null, "certifications" jsonb not null, "questions" jsonb not null, "version" int not null default 1, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(`create index "cvs_user_id_index" on "cvs" ("user_id");`);

    this.addSql(
      `alter table "cvs" add constraint "cvs_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "cvs" cascade;`);
  }
}
