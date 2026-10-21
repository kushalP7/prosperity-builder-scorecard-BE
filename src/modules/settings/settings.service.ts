import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AppSettings } from './entities/app-settings.entity';
import { RatingBand } from './entities/rating-band.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(AppSettings) private settingsModel: typeof AppSettings,
    @InjectModel(RatingBand) private ratingBandModel: typeof RatingBand,
    private sequelize: Sequelize,
  ) {}

  async getSettings(): Promise<AppSettings> {
    let settings = await this.settingsModel.findOne({
      include: [{ model: RatingBand, as: 'ratingBands' }],
    });

    if (!settings) {
      const transaction = await this.sequelize.transaction();
      try {
        settings = await this.settingsModel.create(
          {
            companyName: 'Rose Associates',
            companyAddress: '123 Planning Way',
            companyPhone: '555-0100',
            planPrices: {
              reportPrice: 15000,
              subscriptionPrice: 36000,
              combinedPrice: 48000,
            },
          },
          { transaction },
        );

        await this.ratingBandModel.bulkCreate(
          [
            { settingsId: settings.id, label: 'Poor', min: 0, max: 20, color: '#B5101A' },
            { settingsId: settings.id, label: 'Average', min: 21, max: 70, color: '#E08A15' },
            { settingsId: settings.id, label: 'Good', min: 71, max: 90, color: '#4B8B3B' },
            { settingsId: settings.id, label: 'Excellent', min: 91, max: 100, color: '#1F6F4A' },
          ],
          { transaction },
        );

        await transaction.commit();

        settings = await this.settingsModel.findByPk(settings.id, {
          include: [{ model: RatingBand, as: 'ratingBands' }],
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else if (!settings.planPrices) {
      await settings.update({
        planPrices: {
          reportPrice: 15000,
          subscriptionPrice: 36000,
          combinedPrice: 48000,
        },
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<AppSettings> {
    const settings = await this.getSettings();
    const transaction = await this.sequelize.transaction();

    const companyName = dto.companyName || dto.companyProfile?.name || settings.companyName;
    const companyLogoUrl = dto.companyLogoUrl !== undefined ? dto.companyLogoUrl : (dto.companyProfile?.logoUrl !== undefined ? dto.companyProfile.logoUrl : settings.companyLogoUrl);
    const companyAddress = dto.companyAddress !== undefined ? dto.companyAddress : (dto.companyProfile?.address !== undefined ? dto.companyProfile.address : settings.companyAddress);
    const companyPhone = dto.companyPhone !== undefined ? dto.companyPhone : (dto.companyProfile?.phone !== undefined ? dto.companyProfile.phone : settings.companyPhone);

    try {
      await settings.update(
        {
          companyName,
          companyLogoUrl,
          companyAddress,
          companyPhone,
          ...(dto.planPrices ? { planPrices: dto.planPrices } : {}),
        },
        { transaction },
      );

      // Re-create rating bands if provided in update
      if (dto.ratingBands && dto.ratingBands.length > 0) {
        await this.ratingBandModel.destroy({
          where: { settingsId: settings.id },
          transaction,
        });

        await this.ratingBandModel.bulkCreate(
          dto.ratingBands.map((band) => ({
            settingsId: settings.id,
            label: band.label,
            min: band.min,
            max: band.max,
            color: band.color,
          })),
          { transaction },
        );
      }

      await transaction.commit();
      return this.getSettings();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
