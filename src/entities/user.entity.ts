import { Exclude } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, UpdateDateColumn, Column, CreateDateColumn, BeforeInsert, OneToMany} from 'typeorm';
import { encrypt } from '../utilities/bycrypt.handler';
import { Tournament } from './tournaments.entity';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true, type: 'varchar', length: 60 })
    username!: string;

    @Column({ unique: true, type: 'varchar', length: 255 })
    email!: string;

    @Exclude()
    @Column({ type: 'varchar', length: 255 })
    password!: string;

    @OneToMany(() => Tournament, tournament => tournament.user)
    tournaments!: Tournament[];

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt!: Date;

    @BeforeInsert()
    async hashPassword() {
        this.password = await encrypt(this.password);
    }
}