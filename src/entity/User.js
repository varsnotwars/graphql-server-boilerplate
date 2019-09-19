import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  BaseEntity
} from "typeorm";
import bcrypt from "bcryptjs";
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

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  @BeforeUpdate()
  async hashNewPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
