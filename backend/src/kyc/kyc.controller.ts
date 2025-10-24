import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('whitelist')
  async whitelist(@Body() body: { address: string; allowed: boolean }) {
    return this.kycService.whitelistAddress(body.address, body.allowed);
  }

  @Post('blacklist')
  async blacklist(@Body() body: { address: string; blocked: boolean }) {
    return this.kycService.blacklistAddress(body.address, body.blocked);
  }

  @Get('is-allowed/:address')
  async isAllowed(@Param('address') address: string) {
    const allowed = await this.kycService.isAllowed(address);
    return { address, allowed };
  }
}
