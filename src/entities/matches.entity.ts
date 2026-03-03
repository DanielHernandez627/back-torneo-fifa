import { Entity, PrimaryGeneratedColumn, UpdateDateColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Phase } from './phase.entity';
import { Team } from './teams.entity';

@Entity({ name: 'matches' })
export class Match {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Phase, phase => phase.matches, {
        onDelete: 'CASCADE',
    })
    phase!: Phase;

    @ManyToOne(() => Team, team => team.homeMatches, {
        onDelete: 'CASCADE',
    })
    homeTeam!: Team;

    @ManyToOne(() => Team, team => team.awayMatches, {
        onDelete: 'CASCADE',
    })
    awayTeam!: Team;

    @Column({ type: 'int', nullable: true })
    homeTeamScore?: number;

    @Column({ type: 'int', nullable: true })
    awayTeamScore?: number;

    @Column({ type: 'int', nullable: true })
    matchday?: number;

    @Column({ type: 'boolean', default: false })
    isPlayed!: boolean;
}