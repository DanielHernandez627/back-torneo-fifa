import { Entity, PrimaryGeneratedColumn, UpdateDateColumn, Column, CreateDateColumn, OneToMany} from 'typeorm';
import { Tournament } from './tournaments.entity';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true, type: 'varchar', length: 60 })
    username!: string;

    @Column({ unique: true, type: 'varchar', length: 255 })
    email!: string;

    @Column({ unique: true, type: 'varchar', length: 128, nullable: true })
    firebaseUid!: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    provider!: string | null;

    @Column({ type: 'boolean', default: false, name: 'is_verified' })
    isVerified!: boolean;

    @OneToMany(() => Tournament, tournament => tournament.user)
    tournaments!: Tournament[];

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt!: Date;
}