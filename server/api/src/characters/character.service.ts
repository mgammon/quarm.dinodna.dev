import { BadRequestException, Injectable } from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { Character, InventorySlot, Verification } from './character.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { cache } from '../items/in-memory-cache';

@Injectable()
export class CharacterService {
  private charactersLastOnlineAt = new Map<string, number>();

  constructor(
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(InventorySlot)
    private inventoryRepository: Repository<InventorySlot>,
  ) {}

  async createOrUpdate(userId: number, character: Partial<Character>) {
    return (await this.update(userId, character)) || (await this.create(userId, character));
  }

  async create(userId: number, character: Partial<Character>) {
    character.id = undefined;
    character.userId = userId;
    const characterCount = await this.characterRepository.countBy({ userId });
    // Check if they have too many characters
    if (characterCount > 500) {
      throw new BadRequestException();
    }
    this.validateInventory(character.inventory);

    const inventory = character.inventory;
    character.inventory = undefined;
    const createdCharacter = await this.characterRepository.save(character);
    const createdInventory = await this.createInventory(userId, createdCharacter.id, null, inventory);
    createdCharacter.inventory = createdInventory;
    return this.mapToDto(createdCharacter, userId);
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

  private async createInventory(
    userId: number,
    characterId: number,
    accountLabel: string | null,
    inventory: InventorySlot[],
  ) {
    if (!inventory || inventory.length === 0) {
      return [];
    }

    // Delete this character's existing inventory
    await this.inventoryRepository.delete({ userId, characterId });
    // And delete the account's existing shared bank inventory (indicated by accountLabel, which right now for everyone will be null)
    // TODO: add a way for people to set an account label for each character
    await this.inventoryRepository.delete({ userId, accountLabel });

    // And recreate them with the new inventory data
    await this.inventoryRepository.insert(
      inventory.map((inventorySlot) => ({
        slot: inventorySlot.slot,
        itemId: inventorySlot.itemId,
        count: inventorySlot.count,
        characterId: inventorySlot.slot?.includes('SharedBank') ? null : characterId,
        userId,
        accountLabel,
      })),
    );

    const characterInventory = await this.inventoryRepository.find({ where: { userId, characterId } });
    const sharedBank = await this.inventoryRepository.findBy({ userId, characterId: IsNull(), accountLabel });

    return [...characterInventory, ...sharedBank];
  }

  async update(userId: number, updates: Partial<Character>) {
    if (!updates.id && !updates.name) {
      return null;
    }

    // If we can't find an existing character by id or name, we can't update
    let existingCharacter: Character;
    if (!updates.id && updates.name) {
      existingCharacter = await this.characterRepository.findOneBy({ name: updates.name, userId });
    } else if (updates.id) {
      existingCharacter = await this.characterRepository.findOneBy({ id: updates.id, userId });
    }
    if (!existingCharacter) {
      return null;
    }

    updates.id = existingCharacter.id;
    updates.accountLabel = updates.accountLabel || existingCharacter.accountLabel;
    const { id } = updates;
    const existsAndOwnedByApiKey = await this.characterRepository.exists({
      where: { id, userId },
    });
    if (!existsAndOwnedByApiKey) {
      throw new BadRequestException('Not found');
    }
    this.validateInventory(updates.inventory);

    // Never update id or userId or inventory (inventory is handled separately in createInventory())
    const { id: _id, userId: _userId, inventory, ...sanitizedUpdates } = updates;
    await this.characterRepository.update({ id }, { ...sanitizedUpdates });

    await this.createInventory(userId, id, updates.accountLabel, inventory);
    const updated = await this.characterRepository.findOne({
      where: { id },
      relations: { inventory: true },
    });
    return this.mapToDto(updated, userId);
  }

  async getById(id: number, userId: number) {
    const character = await this.characterRepository.findOne({
      where: { id },
      relations: { inventory: true },
    });
    return this.mapToDto(character, userId);
  }

  // TODO:  Load this when you load characters, or add them to character inventories, or idk
  async getSharedBanks(userId: number) {
    return this.inventoryRepository.findBy({
      userId,
      characterId: IsNull(),
    });
  }

  async getByUserId(userId: number) {
    const characters = await this.characterRepository.find({
      where: { userId },
      relations: { inventory: true },
    });
    return characters.map((character) => this.mapToDto(character, userId));
  }

  async getVerificationCode(userId: number, isMuleRequest: boolean) {
    const existingUnused = await this.verificationRepository.findOne({
      where: { userId, name: IsNull(), isMule: isMuleRequest ? false : null },
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
      userId,
      code: this.generateVerificationCode(),
      isMule: isMuleRequest ? false : null,
    });

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
    existingUnused.name = name.toLowerCase();
    const verified = await this.verificationRepository.save(existingUnused);

    // If we already verified this name, delete the other verifications.
    await this.verificationRepository.delete({
      name: name.toLowerCase(),
      id: Not(verified.id),
    });

    return verified;
  }

  async getVerifiedCharacters(userId: number) {
    const verifiedCharacters = await this.verificationRepository.find({
      where: {
        userId,
        name: Not(IsNull()),
      },
    });

    return verifiedCharacters.map((verifiedCharacter) => ({
      name: verifiedCharacter.name,
      isMule: verifiedCharacter.isMule,
      updatedAt: verifiedCharacter.updatedAt,
    }));
  }

  private generateVerificationCode() {
    return `${this.generateAlphaOnlyKey()} ${this.generateAlphaOnlyKey()} ${this.generateAlphaOnlyKey()} ${this.generateAlphaOnlyKey()}`;
  }

  private generateAlphaOnlyKey(length = 4) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  lastOnlineAt(characterName: string) {
    if (!characterName) {
      return 0;
    }
    return this.charactersLastOnlineAt.get(characterName.toLowerCase()) || 0;
  }

  // If last online at less than 2 minutes ago
  isOnline(characterName: string) {
    return Date.now() - this.lastOnlineAt(characterName) < 60_000 * 2;
  }

  // Return null if not allowed, true if we set them to online, false if they were already online
  async setLastOnlineAt(userId: number, characterName: string) {
    // Check if they're verified
    const isVerified = await this.isVerifiedByUser(userId, characterName);
    if (!isVerified) {
      return null;
    }

    const isAlreadyOnline = this.isOnline(characterName);
    this.charactersLastOnlineAt.set(characterName.toLowerCase(), Date.now());
    return isAlreadyOnline;
  }

  // Check if a name is verified by a specific user
  // Cached for 24 hours.  Could be indefinitely, though, it doesn't change.
  private isVerifiedByUser(userId: number, name: string) {
    return cache(
      'isVerifiedByUser',
      userId + name,
      () => this.verificationRepository.existsBy({ userId, name: name.toLowerCase() }),
      60_000 * 60 * 24,
    );
  }

  async deleteById(id: number, userId: number) {
    const existsAndOwnedByApiKey = await this.characterRepository.exists({
      where: { id, userId },
    });
    if (!existsAndOwnedByApiKey) {
      throw new BadRequestException('Not found');
    }
    await this.inventoryRepository.delete({ characterId: id });
    await this.characterRepository.delete({ id, userId });
  }

  mapInventoryToDto(inventory?: InventorySlot[]) {
    return inventory?.map((inventorySlot) => ({
      slot: inventorySlot.slot,
      itemId: inventorySlot.itemId,
      count: inventorySlot.count,
      accountLabel: inventorySlot.accountLabel,
    }));
  }

  mapToDto(character: Character, userId: number) {
    if (!character) {
      return null;
    }
    const inventory = this.mapInventoryToDto(character.inventory);

    return {
      id: character.id,
      lastOnlineAt: this.lastOnlineAt(character.name),
      name: character.name,
      guild: character.guild,
      class: character.class,
      race: character.race,
      level: character.level,
      stats: character.stats,
      slots: character.slots,
      updatedAt: character.updatedAt,
      owner: character.userId === userId,
      accountLabel: character.accountLabel,
      inventory,
    };
  }
}
