import { Entity, PrimaryGeneratedColumn, UpdateDateColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tournament } from './tournaments.entity';
import { Match } from './matches.entity';
import { PhaseStatus } from '../enums/phaseStatus';

@Entity({ name: 'phases' })
export class Phase {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'int', nullable: true })
    orderNumber?: number;

    @Column({
        type: 'enum',
        enum: PhaseStatus,
        default: PhaseStatus.SCHEDULED,
    })
    status!: PhaseStatus;

    @ManyToOne(() => Tournament, tournament => tournament.phases, {
        onDelete: 'CASCADE',
    })
    tournament!: Tournament;

    @OneToMany(() => Match, match => match.phase)
    matches!: Match[];

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt!: Date;
}