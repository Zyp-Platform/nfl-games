import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { GameCard } from '../GameCard';
import type { Game } from '../../types/api';

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('GameCard', () => {
  const baseGame: Game = {
    id: 'game_123',
    externalIds: {},
    homeTeam: {
      id: 'team_sea',
      abbreviation: 'SEA',
      displayName: 'Seattle Seahawks',
      logo: 'https://example.com/sea.png',
    },
    awayTeam: {
      id: 'team_sf',
      abbreviation: 'SF',
      displayName: 'San Francisco 49ers',
      logo: 'https://example.com/sf.png',
    },
    status: 'FINAL',
    score: {
      home: 24,
      away: 21,
      differential: 3,
      periods: [
        { home: 7, away: 7 },
        { home: 7, away: 7 },
        { home: 7, away: 7 },
        { home: 3, away: 0 },
      ],
    },
    scheduledAt: '2025-11-10T13:00:00Z',
    metadata: {
      season: 2025,
      seasonType: 'regular',
      week: 10,
      lastModified: '2025-11-10T16:00:00Z',
    },
    broadcasts: [],
    isLive: false,
    isCompleted: true,
    isClutchTime: false,
    title: 'San Francisco 49ers at Seattle Seahawks',
    shortTitle: 'SF @ SEA',
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders team abbreviations', () => {
    render(<GameCard game={baseGame} />);
    expect(screen.getByText('SEA')).toBeInTheDocument();
    expect(screen.getByText('SF')).toBeInTheDocument();
  });

  it('renders team logos', () => {
    render(<GameCard game={baseGame} />);
    const logos = screen.getAllByRole('img');
    expect(logos).toHaveLength(2);
    expect(logos[0]).toHaveAttribute('src', 'https://example.com/sf.png');
    expect(logos[1]).toHaveAttribute('src', 'https://example.com/sea.png');
  });

  it('renders final scores for completed game', () => {
    render(<GameCard game={baseGame} />);
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
  });

  it('highlights winning team', () => {
    const { container } = render(<GameCard game={baseGame} />);
    const homeScore = container.querySelector('[class*="text-primary"]');
    expect(homeScore?.textContent).toBe('24');
  });

  it('renders scheduled game with date and time', () => {
    const scheduledGame = {
      ...baseGame,
      status: 'SCHEDULED' as const,
      isCompleted: false,
      score: { home: 0, away: 0, differential: 0, periods: [] },
    };
    render(<GameCard game={scheduledGame} />);
    expect(screen.getAllByText(/Nov 10/i).length).toBeGreaterThan(0);
  });

  it('renders live game with clock and period', () => {
    const liveGame = {
      ...baseGame,
      status: 'IN_PROGRESS' as const,
      isLive: true,
      isCompleted: false,
      period: 3 as const,
      clock: '8:42',
    };
    render(<GameCard game={liveGame} />);
    expect(screen.getByText('Q3 8:42')).toBeInTheDocument();
  });

  it('renders halftime status', () => {
    const halftimeGame = {
      ...baseGame,
      status: 'HALFTIME' as const,
      isLive: true,
      isCompleted: false,
    };
    render(<GameCard game={halftimeGame} />);
    expect(screen.getByText('HALF')).toBeInTheDocument();
  });

  it('shows clutch time badge', () => {
    const clutchGame = {
      ...baseGame,
      isClutchTime: true,
      isLive: true,
    };
    render(<GameCard game={clutchGame} />);
    expect(screen.getByText('CLUTCH')).toBeInTheDocument();
  });

  it('shows broadcast network', () => {
    const gameWithBroadcast = {
      ...baseGame,
      broadcasts: [{ network: 'FOX' }],
    };
    render(<GameCard game={gameWithBroadcast} />);
    expect(screen.getByText('FOX')).toBeInTheDocument();
  });

  it('shows live indicator for in-progress games', () => {
    const liveGame = {
      ...baseGame,
      status: 'IN_PROGRESS' as const,
      isLive: true,
      isCompleted: false,
      period: 2 as const,
      clock: '5:30',
    };
    const { container } = render(<GameCard game={liveGame} />);
    const liveIndicator = container.querySelector('.animate-ping');
    expect(liveIndicator).toBeInTheDocument();
  });

  it('navigates to game details when clicking on completed game', async () => {
    const user = userEvent.setup();
    render(<GameCard game={baseGame} />);

    const card = screen.getByText('SEA').closest('div')?.parentElement?.parentElement;
    if (card) {
      await user.click(card);
    }
    // Link should navigate to game details
    expect(screen.getByText('SEA').closest('a')).toHaveAttribute('href', '/game/game_123');
  });

  it('navigates to team page when clicking team', async () => {
    const user = userEvent.setup();
    render(<GameCard game={baseGame} />);

    await user.click(screen.getByText('SEA'));
    expect(mockNavigate).toHaveBeenCalledWith('/team/team_sea');
  });

  it('calls onTeamClick when provided', async () => {
    const onTeamClick = vi.fn();
    const user = userEvent.setup();
    render(<GameCard game={baseGame} onTeamClick={onTeamClick} />);

    await user.click(screen.getByText('SEA'));
    expect(onTeamClick).toHaveBeenCalledWith('team_sea');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows possession indicator for away team', () => {
    render(
      <GameCard game={{ ...baseGame, isLive: true }} possessionTeamId="team_sf" />
    );
    const awayTeamSection = screen.getByText('SF').parentElement;
    expect(awayTeamSection?.className).toContain('bg-green-600/10');
  });

  it('shows possession indicator for home team', () => {
    render(
      <GameCard game={{ ...baseGame, isLive: true }} possessionTeamId="team_sea" />
    );
    const homeTeamSection = screen.getByText('SEA').parentElement;
    expect(homeTeamSection?.className).toContain('bg-green-600/10');
  });

  it('is not clickable for scheduled games', () => {
    const scheduledGame = {
      ...baseGame,
      status: 'SCHEDULED' as const,
      isLive: false,
      isCompleted: false,
    };
    render(<GameCard game={scheduledGame} />);
    const link = screen.getByText('SEA').closest('a');
    expect(link).toBeNull();
  });

  it('is clickable for live games', () => {
    const liveGame = {
      ...baseGame,
      status: 'IN_PROGRESS' as const,
      isLive: true,
      isCompleted: false,
    };
    render(<GameCard game={liveGame} />);
    const link = screen.getByText('SEA').closest('a');
    expect(link).toHaveAttribute('href', '/game/game_123');
  });

  it('handles games without team logos', () => {
    const gameWithoutLogos = {
      ...baseGame,
      homeTeam: { ...baseGame.homeTeam, logo: undefined },
      awayTeam: { ...baseGame.awayTeam, logo: undefined },
    };
    render(<GameCard game={gameWithoutLogos} />);
    const logos = screen.queryAllByRole('img');
    expect(logos).toHaveLength(0);
  });

  it('handles tied games', () => {
    const tiedGame = {
      ...baseGame,
      score: {
        home: 21,
        away: 21,
        differential: 0,
        periods: [],
      },
    };
    render(<GameCard game={tiedGame} />);
    // Should display 21-21 score
    const scores = screen.getAllByText('21');
    expect(scores.length).toBeGreaterThanOrEqual(2);
  });
});
