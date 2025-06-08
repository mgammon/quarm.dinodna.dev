import { Body, Controller, Get, Param, Post, Patch, BadRequestException, Delete, Query, Request } from '@nestjs/common';
import * as rawbody from 'raw-body';
import { CharacterService } from './character.service';
import { ApiUser, requireUser } from '../utils';
import { Character } from './character.entity';
import { User } from '../user/user.entity';
import { parseZealInventoryFile } from './zeal-inventory-file-parser';
import { Readable } from 'stream';

@Controller('api/characters')
export class CharacterController {
  constructor(private characterService: CharacterService) {}

  @Post('/inventory/:characterName')
  async uploadInventoryFile(
    @Request() req: Readable,
    @Param('characterName') characterName: string,
    @ApiUser() user: User,
  ) {
    requireUser(user);

    if (!req.readable) {
      throw new BadRequestException();
    }

    const fileText = (await rawbody(req)).toString().trim();
    const parsed = parseZealInventoryFile(fileText);
    if (!parsed) {
      return null;
    }

    const firstLetter = characterName.slice(0, 1).toUpperCase();
    const rest = characterName.slice(1).toLowerCase();

    const { inventory, slots } = parsed;
    return this.characterService.createOrUpdate(user.id, { name: firstLetter + rest, inventory, slots });
  }

  @Get('/verification-code')
  getVerificationCode(@Query('isMule') isMuleRequest: string, @ApiUser() user: User) {
    requireUser(user);
    return this.characterService.getVerificationCode(user.id, isMuleRequest === 'true');
  }

  @Get('/verified')
  getVerifiedCharacters(@ApiUser() user: User) {
    requireUser(user);
    return this.characterService.getVerifiedCharacters(user.id);
  }

  @Get('/:id')
  getById(@Param('id') id: string, @ApiUser() user: User) {
    requireUser(user);
    const characterId = Number.parseInt(id);
    if (Number.isNaN(characterId)) {
      throw new BadRequestException();
    }
    return this.characterService.getById(characterId, user.id);
  }

  @Get('/')
  getByApiKey(@ApiUser() user: User) {
    requireUser(user);
    return this.characterService.getByUserId(user.id);
  }

  @Post('/')
  createCharacter(@Body() character: Partial<Character>, @ApiUser() user: User) {
    requireUser(user);
    return this.characterService.createOrUpdate(user.id, character);
  }

  @Patch('/:id')
  updateCharacter(@Param('id') id: string, @Body() character: Partial<Character>, @ApiUser() user: User) {
    requireUser(user);
    if (Number.isNaN(character.id)) {
      throw new BadRequestException();
    }

    return this.characterService.createOrUpdate(user.id, character);
  }

  @Delete('/:id')
  deleteById(@Param('id') id: string, @ApiUser() user: User) {
    requireUser(user);
    const characterId = Number.parseInt(id);
    if (Number.isNaN(characterId)) {
      throw new BadRequestException();
    }
    return this.characterService.deleteById(characterId, user.id);
  }
}
