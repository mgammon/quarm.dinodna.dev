import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ItemTracker, ItemTrackerDto } from './item-tracker.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from '../items/item.entity';

@Injectable()
export class ItemTrackerService {
  constructor(
    @InjectRepository(ItemTracker)
    private itemTrackerRepository: Repository<ItemTracker>,
  ) {}

  async create(itemTrackerDto: ItemTrackerDto, apiKey: string) {
    // Check if they have too many itemTrackers
    const count = await this.itemTrackerRepository.countBy({ apiKey });
    if (count > 500) {
      throw new BadRequestException();
    }

    // Create it
    const { itemId, wts, price } = itemTrackerDto;
    const { id } = await this.itemTrackerRepository.save({
      apiKey,
      itemId,
      wts,
      priceValue: price.value,
      priceOperator: price.operator,
    });

    const createdItemTracker = await this.itemTrackerRepository.findOne({
      where: { id },
      relations: { item: true },
    });

    // Return the created item tracker
    return this.mapToDto(createdItemTracker);
  }

  async update(id: number, apiKey: string, itemTrackerDto: ItemTrackerDto) {
    // Make sure we can update it
    const existsAndOwnedByApiKey = await this.itemTrackerRepository.exists({
      where: { id, apiKey },
    });
    if (!existsAndOwnedByApiKey) {
      throw new BadRequestException('Not found');
    }

    // Update it
    const { itemId, wts, price } = itemTrackerDto;
    await this.itemTrackerRepository.update(
      { id },
      {
        apiKey,
        itemId,
        wts,
        priceValue: price.value,
        priceOperator: price.operator,
      },
    );

    // Return the updated item tracker
    const updated = await this.itemTrackerRepository.findOne({
      where: { id },
      relations: { item: true },
    });
    return this.mapToDto(updated);
  }

  async getByApiKey(apiKey: string) {
    const itemTrackers = await this.itemTrackerRepository.find({
      where: { apiKey },
      relations: { item: true },
    });
    return itemTrackers.map((itemTracker) => this.mapToDto(itemTracker));
  }

  async deleteById(id: number, apiKey: string) {
    const existsAndOwnedByApiKey = await this.itemTrackerRepository.exists({
      where: { id, apiKey },
    });
    if (!existsAndOwnedByApiKey) {
      throw new BadRequestException('Not found');
    }
    await this.itemTrackerRepository.delete({ id, apiKey });
  }

  mapToDto(itemTracker: ItemTracker): ItemTrackerDto {
    if (!itemTracker) {
      return null;
    }

    let item: Partial<Item> | undefined = undefined;
    if (itemTracker.item) {
      const { id, name, icon, itemtype } = itemTracker.item;
      item = { id, name, icon, itemtype };
    }

    return {
      id: itemTracker.id,
      itemId: itemTracker.itemId,
      wts: itemTracker.wts,
      price: {
        value: itemTracker.priceValue,
        operator: itemTracker.priceOperator,
      },
      item,
    };
  }
}
