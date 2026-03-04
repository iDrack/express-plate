import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";
import { IsEmail, Length } from "class-validator";
import { FileInfo } from "./fileInfo.js";
import { Role } from "./role.js";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true, type: "varchar" })
    @IsEmail()
    email!: string;

    @Column({ unique: true, type: "varchar" })
    @Length(3, 100)
    name!: string;

    @Column({ type: "varchar" })
    @Length(8, 100)
    password!: string;

    @Column({ type: "enum", enum: Role, default: Role.USER })
    role!: Role;

    @OneToMany(() => FileInfo, (fileInfo) => fileInfo.user)
    files!: Relation<FileInfo>[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get createdAtLocal(): string {
        return this.createdAt.toLocaleString("fr-FR", {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
    }
}
