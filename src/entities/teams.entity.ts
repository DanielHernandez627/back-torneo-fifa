import { Entity, PrimaryGeneratedColumn, UpdateDateColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Tournament } from './tournaments.entity'; 
import { Match } from './matches.entity';

@Entity({ name: 'teams' })
export class Team {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @ManyToOne(() => Tournament, tournament => tournament.teams, {
        onDelete: 'CASCADE',
    })
    tournament!: Tournament;

    @OneToMany(() => Match, match => match.homeTeam)
    homeMatches!: Match[];

    @OneToMany(() => Match, match => match.awayTeam)
    awayMatches!: Match[];

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt!: Date;
}