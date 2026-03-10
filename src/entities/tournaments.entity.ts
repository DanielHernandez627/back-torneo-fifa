import {  Entity, PrimaryGeneratedColumn, UpdateDateColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { TournamentType } from '../enums/tournamentType';
import { Team } from './teams.entity';
import { Phase } from './phase.entity';

@Entity({ name: 'tournaments' })
export class Tournament {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({
        type: 'enum',
        enum: TournamentType,
        default: TournamentType.LEAGUE,
    })
    type!: TournamentType;

    @ManyToOne(() => User, user => user.tournaments, {
        onDelete: 'CASCADE',
    })
    user!: User;

    @OneToMany(() => Team, team => team.tournament)
    teams!: Team[];

    @OneToMany(() => Phase, phase => phase.tournament)
    phases!: Phase[];

    @ManyToOne(() => Team, { nullable: true })
    champion?: Team | null;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
    updatedAt!: Date;
}