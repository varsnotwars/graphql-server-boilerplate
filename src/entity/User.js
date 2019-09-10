import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
// If you are using JavaScript instead of TypeScript you must explicitly provide a column type.
@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id = undefined;

    @Column("varchar")
    firstName = "";

    @Column("varchar")
    lastName = "";

    @Column("int")
    age = 0;

}
