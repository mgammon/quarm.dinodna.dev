import { BadRequestException, Injectable } from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { Character, InventorySlot, Verification } from './character.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(InventorySlot)
    private inventoryRepository: Repository<InventorySlot>,
  ) {}

  async create(character: Character, apiKey: string) {
    character.id = undefined;
    character.apiKey = apiKey;
    const characterCount = await this.characterRepository.countBy({ apiKey });
    // Check if they have too many characters
    if (characterCount > 500) {
      throw new BadRequestException();
    }
    this.validateInventory(character.inventory);

    const inventory = character.inventory;
    character.inventory = undefined;
    const createdCharacter = await this.characterRepository.save(character);
    const createdInventory = await this.createInventory(createdCharacter.id, apiKey, inventory);
    createdCharacter.inventory = createdInventory;
    return this.mapToDto(createdCharacter, apiKey);
  }

  validateInventory(inventory?: InventorySlot[]) {
    // Check if inventory is too long, slots names are too long, or if IDs are set (except item IDs)
    if (
      inventory &&
      (inventory.length > 2500 || inventory.some((i) => (i.slot && i.slot.length > 100) || !!i.characterId || !!i.id))
    ) {
      throw new BadRequestException();
    }
  }

  async createInventory(characterId: number, apiKey: string, inventory: InventorySlot[]) {
    const existsAndOwnedByApiKey = await this.characterRepository.exists({
      where: { id: characterId, apiKey },
    });
    if (!existsAndOwnedByApiKey) {
      throw new BadRequestException('Not found');
    }

    if (!inventory) {
      return [];
    }

    await this.inventoryRepository.delete({ characterId });
    await this.inventoryRepository.insert(
      inventory.map((inventorySlot) => ({
        slot: inventorySlot.slot,
        itemId: inventorySlot.itemId,
        count: inventorySlot.count,
        characterId,
      })),
    );

    return this.inventoryRepository.find({ where: { characterId } });
  }

  async update(id: number, apiKey: string, updates: Partial<Character>) {
    const existsAndOwnedByApiKey = await this.characterRepository.exists({
      where: { id, apiKey },
    });
    if (!existsAndOwnedByApiKey) {
      throw new BadRequestException('Not found');
    }
    this.validateInventory(updates.inventory);

    // Never update id or apiKey or inventory
    const { id: _id, apiKey: _apiKey, inventory, ...sanitizedUpdates } = updates;
    await this.characterRepository.update({ id }, { ...sanitizedUpdates });
    await this.createInventory(id, apiKey, inventory);
    const updated = await this.characterRepository.findOne({
      where: { id },
      relations: { inventory: true },
    });
    return this.mapToDto(updated, apiKey);
  }

  async getById(id: number, apiKey: string) {
    const character = await this.characterRepository.findOne({
      where: { id },
      relations: { inventory: true },
    });
    return this.mapToDto(character, apiKey);
  }

  async getByApiKey(apiKey: string) {
    const characters = await this.characterRepository.find({
      where: { apiKey },
      relations: { inventory: true },
    });
    return characters.map((character) => this.mapToDto(character, apiKey));
  }

  async getVerificationCode(apiKey: string, isMuleRequest: boolean) {
    const existingUnused = await this.verificationRepository.findOne({
      where: { apiKey, name: IsNull() },
    });
    // Already have an existing unused verification code: return if it's good, or delete it if it's bad
    if (existingUnused) {
      const isExpired = existingUnused.createdAt.getTime() < Date.now() - 15 * 60_000;
      if (isExpired) {
        await this.verificationRepository.delete({ id: existingUnused.id });
      } else {
        return existingUnused.code;
      }
    }

    // Create a new verification
    const verification = await this.verificationRepository.save({
      apiKey,
      code: this.generateKey(),
      isMule: isMuleRequest ? false : null,
    });
    console.log(verification);

    return verification.code;
  }

  async verifyCharacter(code: string, name: string): Promise<Verification | undefined> {
    // Check if the an unused code exists
    const existingUnused = await this.verificationRepository.findOne({
      where: { code, name: IsNull() },
    });
    if (!existingUnused) {
      return;
    }
    // And check if it's expired
    const isExpired = existingUnused.createdAt.getTime() < Date.now() - 15 * 60_000;
    if (isExpired) {
      return;
    }

    // Otherwise, verify it
    existingUnused.name = name;
    const verified = await this.verificationRepository.save(existingUnused);

    return verified;
  }

  async getVerifiedCharacters(apiKey: string) {
    const verifiedCharacters = await this.verificationRepository.find({
      where: {
        apiKey,
        name: Not(IsNull()),
      },
    });

    return verifiedCharacters.map((verifiedCharacter) => ({
      name: verifiedCharacter.name,
      isMule: verifiedCharacter.isMule,
      updatedAt: verifiedCharacter.updatedAt,
    }));
  }

  private generateKey(length = 8) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  async deleteById(id: number, apiKey: string) {
    const existsAndOwnedByApiKey = await this.characterRepository.exists({
      where: { id, apiKey },
    });
    if (!existsAndOwnedByApiKey) {
      throw new BadRequestException('Not found');
    }
    await this.inventoryRepository.delete({ characterId: id });
    await this.characterRepository.delete({ id, apiKey });
  }

  mapToDto(character: Character, apiKey: string) {
    if (!character) {
      return null;
    }
    const inventory = character.inventory?.map((inventorySlot) => ({
      slot: inventorySlot.slot,
      itemId: inventorySlot.itemId,
      count: inventorySlot.count,
    }));

    return {
      id: character.id,
      name: character.name,
      guild: character.guild,
      class: character.class,
      race: character.race,
      level: character.level,
      stats: character.stats,
      slots: character.slots,
      updatedAt: character.updatedAt,
      owner: character.apiKey === apiKey,
      inventory,
    };
  }
}
