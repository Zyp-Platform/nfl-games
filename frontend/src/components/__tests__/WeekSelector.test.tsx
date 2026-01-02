import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { WeekSelector } from '../WeekSelector';

describe('WeekSelector', () => {
  const defaultProps = {
    week: 5,
    maxWeek: 18,
    onPrevWeek: vi.fn(),
    onNextWeek: vi.fn(),
    onMenuOpen: vi.fn(),
  };

  it('renders current week', () => {
    render(<WeekSelector {...defaultProps} />);
    expect(screen.getByText('Week 5')).toBeInTheDocument();
  });

  it('renders filter button', () => {
    render(<WeekSelector {...defaultProps} />);
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('calls onPrevWeek when clicking previous button', async () => {
    const user = userEvent.setup();
    render(<WeekSelector {...defaultProps} />);

    await user.click(screen.getByText('Prev'));
    expect(defaultProps.onPrevWeek).toHaveBeenCalledOnce();
  });

  it('calls onNextWeek when clicking next button', async () => {
    const user = userEvent.setup();
    render(<WeekSelector {...defaultProps} />);

    await user.click(screen.getByText('Next'));
    expect(defaultProps.onNextWeek).toHaveBeenCalledOnce();
  });

  it('calls onMenuOpen when clicking filter button', async () => {
    const user = userEvent.setup();
    render(<WeekSelector {...defaultProps} />);

    await user.click(screen.getByText('Filter'));
    expect(defaultProps.onMenuOpen).toHaveBeenCalledOnce();
  });

  it('disables previous button at week 1', () => {
    render(<WeekSelector {...defaultProps} week={1} />);
    const prevButton = screen.getByText('Prev').closest('button');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button at max week', () => {
    render(<WeekSelector {...defaultProps} week={18} />);
    const nextButton = screen.getByText('Next').closest('button');
    expect(nextButton).toBeDisabled();
  });

  it('enables previous button when week > 1', () => {
    render(<WeekSelector {...defaultProps} week={5} />);
    const prevButton = screen.getByText('Prev').closest('button');
    expect(prevButton).not.toBeDisabled();
  });

  it('enables next button when week < maxWeek', () => {
    render(<WeekSelector {...defaultProps} week={5} />);
    const nextButton = screen.getByText('Next').closest('button');
    expect(nextButton).not.toBeDisabled();
  });

  it('uses default maxWeek of 18 if not provided', () => {
    const props = { ...defaultProps, maxWeek: undefined };
    render(<WeekSelector {...props} week={17} />);
    const nextButton = screen.getByText('Next').closest('button');
    expect(nextButton).not.toBeDisabled();
  });

  it('renders navigation controls', () => {
    render(<WeekSelector {...defaultProps} />);
    expect(screen.getByText('Prev')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Week 5')).toBeInTheDocument();
  });
});
