import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";

@Entity("user_sessions")
export class UserSession extends BaseEntity {
  @PrimaryGeneratedColumn()
  id = undefined;

  @Column("varchar", { length: 128, nullable: false })
  session_id = 0;

  @Column("uuid", { nullable: false })
  user_id = undefined;
}
