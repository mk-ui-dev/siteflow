import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskBlocks1738176000000 implements MigrationInterface {
  name = 'AddTaskBlocks1738176000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "block_type_enum" AS ENUM ('DELIVERY', 'DECISION', 'DEPENDENCY', 'MANUAL')
    `);

    await queryRunner.query(`
      CREATE TYPE "block_scope_enum" AS ENUM ('START', 'DONE')
    `);

    await queryRunner.query(`
      CREATE TYPE "entity_type_enum" AS ENUM ('TASK', 'INSPECTION', 'ISSUE', 'DELIVERY', 'DECISION', 'LOCATION')
    `);

    // Create task_blocks table
    await queryRunner.query(`
      CREATE TABLE "task_blocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "task_id" uuid NOT NULL,
        "block_type" "block_type_enum" NOT NULL,
        "scope" "block_scope_enum" NOT NULL DEFAULT 'START',
        "ref_entity_type" "entity_type_enum",
        "ref_entity_id" uuid,
        "message" text NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid NOT NULL,
        CONSTRAINT "PK_task_blocks" PRIMARY KEY ("id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "task_blocks"
      ADD CONSTRAINT "FK_task_blocks_task"
      FOREIGN KEY ("task_id")
      REFERENCES "tasks"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "task_blocks"
      ADD CONSTRAINT "FK_task_blocks_creator"
      FOREIGN KEY ("created_by")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_task_blocks_task_id" ON "task_blocks" ("task_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_task_blocks_active" ON "task_blocks" ("task_id", "is_active", "scope")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_task_blocks_reference" ON "task_blocks" ("ref_entity_type", "ref_entity_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_task_blocks_reference"`);
    await queryRunner.query(`DROP INDEX "IDX_task_blocks_active"`);
    await queryRunner.query(`DROP INDEX "IDX_task_blocks_task_id"`);
    await queryRunner.query(`ALTER TABLE "task_blocks" DROP CONSTRAINT "FK_task_blocks_creator"`);
    await queryRunner.query(`ALTER TABLE "task_blocks" DROP CONSTRAINT "FK_task_blocks_task"`);
    await queryRunner.query(`DROP TABLE "task_blocks"`);
    await queryRunner.query(`DROP TYPE "entity_type_enum"`);
    await queryRunner.query(`DROP TYPE "block_scope_enum"`);
    await queryRunner.query(`DROP TYPE "block_type_enum"`);
  }
}
