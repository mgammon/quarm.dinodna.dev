import { Body, Controller, Get, Param, Post, Patch, Headers, BadRequestException, Delete, Query } from '@nestjs/common';
import { CharacterService } from './character.service';
import { getApiKey } from '../utils';
import { Character } from './character.entity';

@Controller('api/characters')
export class CharacterController {
  constructor(private characterService: CharacterService) {}

  @Get('/verification-code')
  getVerificationCode(@Query('isMule') isMuleRequest: string, @Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    if (!apiKey) {
      throw new BadRequestException();
    }
    return this.characterService.getVerificationCode(apiKey, isMuleRequest === 'true');
  }

  @Get('/verified')
  getVerifiedCharacters(@Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    if (!apiKey) {
      throw new BadRequestException();
    }
    return this.characterService.getVerifiedCharacters(apiKey);
  }

  @Get('/:id')
  getById(@Param('id') id: string, @Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    const characterId = Number.parseInt(id);
    if (Number.isNaN(characterId) || !apiKey) {
      throw new BadRequestException();
    }
    return this.characterService.getById(characterId, apiKey);
  }

  @Get('/')
  getByApiKey(@Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    if (!apiKey) {
      throw new BadRequestException();
    }
    return this.characterService.getByApiKey(apiKey);
  }

  @Post('/')
  createCharacter(@Body() character: Character, @Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    if (!apiKey) {
      throw new BadRequestException();
    }
    return this.characterService.create(character, apiKey);
  }

  @Patch('/:id')
  updateCharacter(
    @Param('id') id: string,
    @Body() character: Partial<Character>,
    @Headers('Authorization') auth: string,
  ) {
    const apiKey = getApiKey(auth);
    const characterId = Number.parseInt(id);
    if (Number.isNaN(characterId) || !apiKey) {
      throw new BadRequestException();
    }

    return this.characterService.update(characterId, apiKey, character);
  }

  @Delete('/:id')
  deleteById(@Param('id') id: string, @Headers('Authorization') auth: string) {
    const apiKey = getApiKey(auth);
    const characterId = Number.parseInt(id);
    if (Number.isNaN(characterId) || !apiKey) {
      throw new BadRequestException();
    }
    return this.characterService.deleteById(characterId, apiKey);
  }
}
