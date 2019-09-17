import { Entity, PrimaryColumn, Column, BaseEntity } from "typeorm";

@Entity("sessions")
export class Session extends BaseEntity {
  @PrimaryColumn("varchar", { length: 128, nullable: false })
  session_id = undefined;

  @Column("int", { nullable: false })
  expires = 0;

  @Column("mediumtext")
  data = undefined;
}
