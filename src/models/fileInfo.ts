import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./user.js";

@Entity()
export class FileInfo {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    originalName!: string;

    @Column({ unique: true, type: "varchar" })
    path!: string;

    @Column({ unique: true, type: "varchar" })
    storedAs!: string;

    @Column({ type: "int" })
    size!: number;

    @Column({type: "varchar" })
    mimeType!: string;

    @ManyToOne(() => User, (user) => user.files)
    user!: User

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
