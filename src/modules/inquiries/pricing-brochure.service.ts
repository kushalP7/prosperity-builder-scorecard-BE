import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3StorageProvider } from '../uploads/providers/s3.provider';
import {
  BROCHURE_S3_KEY_DEFAULT,
  BROCHURE_SIGNED_URL_TTL_SECONDS,
} from '../../common/pricing-brochure';
import { getErrorMessage, getErrorStack } from '../../common/errors';


@Injectable()
export class PricingBrochureService {
  private readonly logger = new Logger(PricingBrochureService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly s3: S3StorageProvider,
  ) {}

  async createPrivateBrochureLink(): Promise<string | null> {
    const key = this.configService.get<string>('BROCHURE_S3_KEY')?.trim() || BROCHURE_S3_KEY_DEFAULT;
    const ttl = Number(this.configService.get<string>('BROCHURE_SIGNED_URL_TTL_SECONDS')) || BROCHURE_SIGNED_URL_TTL_SECONDS;

    try {
      const exists = await this.s3.objectExists(key);
      if (!exists) {
        this.logger.error(`Brochure not found at "${key}". Upload the PDF once to S3 (Rose/private/) then retry.` );
        return null;
      }

      const signedUrl = await this.s3.getSignedDownloadUrl(key, ttl);
      this.logger.log(`Issued signed brochure URL for "${key}" (expires in ${ttl}s).`);
      return signedUrl;
    } catch (err: unknown) {
      this.logger.error(`Failed to sign brochure link: ${getErrorMessage(err)}`, getErrorStack(err));
      return null;
    }
  }
}
