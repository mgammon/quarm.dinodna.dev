import { InventorySlot } from './character.entity';

export function parseZealInventoryFile(data: ArrayBuffer | string | undefined | null) {
  if (!data) {
    return null;
  }

  // Parse the text into inventory
  const text = data.toString();
  const lines = text.replaceAll('\r', '').split('\n').slice(1);
  const inventory = lines.map((line) => {
    const [location, _name, id, count, _slots] = line.split('\t');
    return {
      slot: location, // Ex: Ear or Wrist or General1-Slot4
      itemId: parseInt(id) || null,
      count: parseInt(count) || null,
    };
  }) as InventorySlot[];

  const equippedInventory = inventory.slice(0, 21);
  const slots = ',' + equippedInventory.map((equipped) => equipped.itemId).join(',');

  return { inventory, slots };
}
