import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BaseEntity
} from "typeorm";

// If you are using JavaScript instead of TypeScript you must explicitly provide a column type.
@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id = undefined;

  @Column("varchar", { length: 255 })
  email = "";

  @Column("varchar", { length: 255 })
  password = "";

  @Column("boolean")
  confirmed = false;
}
