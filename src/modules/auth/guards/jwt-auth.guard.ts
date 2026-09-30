import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from '../services/token.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedException('Authentication required. Missing Bearer token.');
    }

    const token = authHeader.substring(7).trim();

    try {
      const payload = await this.tokenService.verifyToken(token);

      if (payload.tokenType && payload.tokenType !== 'access') {
        throw new UnauthorizedException('Invalid token type for API access.');
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        name: payload.name,
        department: payload.department,
      };

      return true;
    } catch (err: any) {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedException(
        err?.code === 'ERR_JWT_EXPIRED'
          ? 'Token has expired. Please refresh your session.'
          : 'Invalid or corrupted authentication token.',
      );
    }
  }
}
