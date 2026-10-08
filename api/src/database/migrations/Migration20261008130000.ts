import { Migration } from '@mikro-orm/migrations';

export class Migration20261008130000 extends Migration {
  override name = 'Migration20261008130000';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "users" ("id" uuid not null, "email" varchar(255) not null, "password_hash" varchar(255) not null, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "users" add constraint "users_email_unique" unique ("email");`,
    );

    this.addSql(
      `create table "cvs" ("id" uuid not null, "user_id" uuid not null, "target_role" varchar(120) not null, "status" varchar(255) not null, "current_step" varchar(255) null, "failure_reason" text null, "initial_user_input" text not null, "source_file_key" varchar(255) null, "document" jsonb null, "facts" jsonb not null default '[]', "questions" jsonb not null, "question_rounds" int not null default 0, "compose_regenerations" int not null default 0, "compose_feedback" jsonb not null default '[]', "version" int not null default 1, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(`create index "cvs_user_id_index" on "cvs" ("user_id");`);
    this.addSql(
      `alter table "cvs" add constraint "cvs_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "cvs" cascade;`);
    this.addSql(`drop table if exists "users" cascade;`);
  }
}
