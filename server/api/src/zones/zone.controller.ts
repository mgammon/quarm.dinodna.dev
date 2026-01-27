import { Controller, Get, Param, Query } from '@nestjs/common';
import { ZoneService } from './zone.service';

@Controller('api/zones')
export class ZoneController {
  constructor(private zoneService: ZoneService) {}

  @Get('/')
  getZones() {
    return this.zoneService.getAll();
  }

  @Get('/:zoneName')
  getZone(@Param('zoneName') zoneName: string) {
    return this.zoneService.getByShortNameOrId(zoneName);
  }

  @Get('/search/:search')
  search(@Param('search') search: string, @Query('page') page = '0', @Query('size') size = '100') {
    return this.zoneService.search(search, parseInt(page), parseInt(size));
  }
}
