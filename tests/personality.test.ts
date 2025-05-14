import { initializeTraits, updateMood, updateEnergy, mapTraitsToHyperparams } from '../src/engines/personality';
import { Traits } from '../src/types';

describe('Personality', () => {
  describe('initializeTraits', () => {
    it('returns traits with valid values', () => {
      const traits = initializeTraits();
      expect(traits).toHaveProperty('curiosity');
      expect(traits).toHaveProperty('empathy');
      expect(traits).toHaveProperty('humor');
      expect(traits).toHaveProperty('mood');
      expect(traits).toHaveProperty('energy');
      Object.values(traits).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('updateMood', () => {
    it('keeps mood within valid range', () => {
      const traits: Traits = { curiosity: 0.5, empathy: 0.5, humor: 0.5, mood: 0.5, energy: 0.5 };
      const updated = updateMood(traits);
      expect(updated.mood).toBeGreaterThanOrEqual(0);
      expect(updated.mood).toBeLessThanOrEqual(1);
    });
  });

  describe('updateEnergy', () => {
    it('keeps energy within valid range', () => {
      const traits: Traits = { curiosity: 0.5, empathy: 0.5, humor: 0.5, mood: 0.5, energy: 0.5 };
      const updated = updateEnergy(traits, 0.3);
      expect(updated.energy).toBeGreaterThanOrEqual(0);
      expect(updated.energy).toBeLessThanOrEqual(1);
    });
  });

  describe('mapTraitsToHyperparams', () => {
    it('returns valid hyperparameters', () => {
      const traits: Traits = { curiosity: 0.5, empathy: 0.5, humor: 0.5, mood: 0.5, energy: 0.5 };
      const hyper = mapTraitsToHyperparams(traits);
      expect(hyper).toHaveProperty('temperature');
      expect(hyper).toHaveProperty('top_p');
      expect(hyper).toHaveProperty('max_tokens');
      expect(hyper).toHaveProperty('frequency_penalty');
      expect(hyper).toHaveProperty('presence_penalty');
    });
  });
}); 