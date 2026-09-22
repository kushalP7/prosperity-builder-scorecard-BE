import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'landing_media', timestamps: true })
export class LandingMedia extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({
    type: DataType.ENUM('video', 'audio', 'document'),
    defaultValue: 'video',
  })
  mediaType: 'video' | 'audio' | 'document';

  @Column({ type: DataType.STRING, allowNull: true })
  videoSource: string; // 'youtube' | 'vimeo' | 'mp4' | 'upload'

  @Column({ type: DataType.STRING, allowNull: true })
  audioSource: string; // 'mp3' | 'external' | 'upload'

  @Column({ type: DataType.TEXT, allowNull: true })
  sourceUrl: string; // Video URL, Audio stream URL, or PDF Document URL

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'Luminaries Podcasts' })
  category: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  featured: boolean;

  @Column({ type: DataType.STRING, defaultValue: 'published' })
  status: string; // 'published' | 'draft'

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  deleted: boolean;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  deletedAt: Date | null;
}
