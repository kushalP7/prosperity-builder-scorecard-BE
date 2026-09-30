import { Table, Column, Model, DataType } from 'sequelize-typescript';

export type UserRole = 
  | 'super_admin' 
  | 'project_lead' 
  | 'assessment_specialist' 
  | 'client_viewer';

export type UserStatus = 'active' | 'pending' | 'suspended';

@Table({ tableName: 'Users', timestamps: true })
export class User extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  password: string;

  @Column({
    type: DataType.STRING(50),
    defaultValue: 'client_viewer',
    allowNull: false,
  })
  role: UserRole;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'Planning Board' })
  department: string;

  @Column({
    type: DataType.STRING(50),
    defaultValue: 'active',
    allowNull: false,
  })
  status: UserStatus;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'bg-rose-700 text-white' })
  avatarBg: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  refreshTokenHash: string;

  @Column({ type: DataType.DATE, allowNull: true })
  lastActive: Date;
}
