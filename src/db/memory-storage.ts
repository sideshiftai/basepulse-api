/**
 * In-memory storage implementation
 * For development/testing - replace with real database in production
 */

import { Address } from 'viem';
import { StoredShift, ShiftStorage } from '../types';
import { randomUUID } from 'crypto';

export class MemoryStorage implements ShiftStorage {
  private shifts: Map<string, StoredShift> = new Map();

  async create(
    shift: Omit<StoredShift, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StoredShift> {
    const id = randomUUID();
    const now = new Date();

    const newShift: StoredShift = {
      ...shift,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.shifts.set(id, newShift);
    return newShift;
  }

  async getById(id: string): Promise<StoredShift | null> {
    return this.shifts.get(id) || null;
  }

  async getBySideshiftOrderId(orderId: string): Promise<StoredShift | null> {
    for (const shift of this.shifts.values()) {
      if (shift.sideshiftOrderId === orderId) {
        return shift;
      }
    }
    return null;
  }

  async getByPollId(pollId: string): Promise<StoredShift[]> {
    const results: StoredShift[] = [];
    for (const shift of this.shifts.values()) {
      if (shift.pollId === pollId) {
        results.push(shift);
      }
    }
    return results;
  }

  async getByUserAddress(address: Address): Promise<StoredShift[]> {
    const results: StoredShift[] = [];
    const normalizedAddress = address.toLowerCase();

    for (const shift of this.shifts.values()) {
      if (shift.userAddress.toLowerCase() === normalizedAddress) {
        results.push(shift);
      }
    }
    return results;
  }

  async update(id: string, updates: Partial<StoredShift>): Promise<StoredShift> {
    const existing = this.shifts.get(id);
    if (!existing) {
      throw new Error(`Shift not found: ${id}`);
    }

    const updated: StoredShift = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID changes
      createdAt: existing.createdAt, // Prevent createdAt changes
      updatedAt: new Date(),
    };

    this.shifts.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.shifts.delete(id);
  }

  // Helper methods for development
  async getAll(): Promise<StoredShift[]> {
    return Array.from(this.shifts.values());
  }

  async clear(): Promise<void> {
    this.shifts.clear();
  }

  async count(): Promise<number> {
    return this.shifts.size;
  }
}

// Export singleton instance
export const storage = new MemoryStorage();
