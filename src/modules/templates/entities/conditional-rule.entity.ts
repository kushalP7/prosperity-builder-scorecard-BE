import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { TemplateColumn } from './template-column.entity';

export enum RuleOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUALS = 'greater_than_or_equals',
  LESS_THAN_OR_EQUALS = 'less_than_or_equals',
  BETWEEN = 'between',
}

@Table({ tableName: 'conditional_rules', timestamps: false })
export class ConditionalRule extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => TemplateColumn)
  @Column({ type: DataType.UUID, allowNull: false })
  columnId: string;

  @BelongsTo(() => TemplateColumn)
  column: TemplateColumn;

  @Column({ type: DataType.STRING, allowNull: false })
  ifColumnId: string; // "__base__" or column UUID

  @Column({ type: DataType.ENUM(...Object.values(RuleOperator)), allowNull: false })
  operator: RuleOperator;

  @Column({ type: DataType.JSONB, allowNull: true })
  conditionValue: any;

  @Column({ type: DataType.JSONB, allowNull: false })
  resultValue: any;
}
