import { config } from '../config/default';
import { logger } from '../utils/logger';

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export class PersonalityEngine {
  private traits: PersonalityTraits;

  constructor(initialTraits?: Partial<PersonalityTraits>) {
    this.traits = {
      ...config.personality.defaultTraits,
      ...initialTraits,
    };
  }

  getTraits(): PersonalityTraits {
    return { ...this.traits };
  }

  updateTrait(trait: keyof PersonalityTraits, value: number): void {
    if (value < 0 || value > 1) {
      throw new Error(`Trait value must be between 0 and 1, got ${value}`);
    }

    this.traits[trait] = value;
    logger.info(`Updated trait ${trait} to ${value}`);
  }

  updateTraits(traits: Partial<PersonalityTraits>): void {
    Object.entries(traits).forEach(([trait, value]) => {
      this.updateTrait(trait as keyof PersonalityTraits, value);
    });
  }
} 