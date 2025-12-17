import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { IsEmail, Length } from 'class-validator';
import { Role } from "./Role.js";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({unique: true, type: 'varchar'})
    @IsEmail()
    email!: string

    @Column({unique: true, type: 'varchar'})
    @Length(3,100)
    name!: string;

    @Column({type: 'varchar'})
    @Length(8,100)
    password!: string;

    @Column({type: 'enum', enum: Role, default: Role.USER})
    role!: Role;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get createdAtLocal(): string {
        return this.createdAt.toLocaleString('fr-FR', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    }
}