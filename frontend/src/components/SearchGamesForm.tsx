/**
 * Search Games Form Component
 * Example of form validation using react-hook-form + Zod schemas
 */

import { useValidatedForm } from '../hooks/useValidation.js';
import { ScoreboardQuerySchema } from '@zyp/zod-schemas';
import { Button } from './ui/button.js';
import type { z } from 'zod';

type ScoreboardQuery = z.infer<typeof ScoreboardQuerySchema>;

interface SearchGamesFormProps {
  onSubmit: (data: ScoreboardQuery) => void;
  isLoading?: boolean;
}

export function SearchGamesForm({ onSubmit, isLoading }: SearchGamesFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useValidatedForm(ScoreboardQuerySchema, {
    defaultValues: {
      seasonType: 'regular',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="seasonType" className="block text-sm font-medium mb-1">
          Season Type
        </label>
        <select
          id="seasonType"
          {...register('seasonType')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="preseason">Pre-Season</option>
          <option value="regular">Regular</option>
          <option value="postseason">Post-Season</option>
        </select>
        {errors.seasonType && (
          <p className="text-red-600 text-sm mt-1">{String(errors.seasonType.message)}</p>
        )}
      </div>

      <div>
        <label htmlFor="week" className="block text-sm font-medium mb-1">
          Week (Optional)
        </label>
        <input
          id="week"
          type="number"
          {...register('week', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          min="1"
          max="21"
          placeholder="Leave empty for all weeks"
        />
        {errors.week && <p className="text-red-600 text-sm mt-1">{String(errors.week.message)}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Loading...' : 'Search Games'}
      </Button>
    </form>
  );
}
