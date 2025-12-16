import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { IsEmail, Length } from 'class-validator';
import { Role } from "./Role";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({unique: true})
    @IsEmail()
    email!: string

    @Column({unique: true})
    @Length(1,100)
    name!: string;

    @Column()
    @Length(8,100)
    password!: string;

    @Column({type: 'enum', enum: Role, default: Role.USER})
    role!: Role;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

}