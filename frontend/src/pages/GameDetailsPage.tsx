import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useGameDetails, useGameSummary } from '../lib/queries';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

type Tab = 'overview' | 'boxscore' | 'leaders' | 'scoring' | 'drives';

export function GameDetailsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: gameData, isLoading: gameLoading, error: gameError } = useGameDetails(gameId);
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
  } = useGameSummary(gameId);

  const isLoading = gameLoading || summaryLoading;
  const error = gameError || summaryError;

  if (isLoading)
    return (
      <div className="container mx-auto px-2 py-3 pb-20">
        <LoadingSpinner />
      </div>
    );

  if (error || !gameData?.game) {
    return (
      <div className="container mx-auto px-2 py-3 pb-20">
        <div className="bg-card rounded-lg p-8 text-center border">
          <div className="text-6xl mb-4">🏈</div>
          <h2 className="text-xl font-bold mb-2">Game Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This game may have moved to a different week or is no longer available.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button onClick={() => navigate('/')} className="gap-2">
              <Calendar className="h-4 w-4" />
              View Current Week
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const game = gameData.game;
  const currentDrive = summaryData?.drives?.current;
  const possessionTeamId = currentDrive?.team.id;

  return (
    <div className="container mx-auto px-2 py-3 pb-20 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-lg font-bold">{game.title}</h1>
      </div>

      {/* Score Card */}
      <div className="bg-card rounded-lg p-4 border">
        <div className="space-y-3">
          {/* Away Team */}
          <div
            className={cn(
              'flex items-center justify-between',
              possessionTeamId === game.awayTeam.id && 'bg-green-600/10 rounded-lg p-2 -m-2'
            )}
          >
            <div className="flex items-center gap-3">
              {game.awayTeam.logo && (
                <img
                  src={game.awayTeam.logo}
                  alt={game.awayTeam.abbreviation}
                  className="w-12 h-12"
                />
              )}
              <div>
                <div
                  className={cn(
                    'font-bold text-lg',
                    possessionTeamId === game.awayTeam.id && 'text-green-600'
                  )}
                >
                  {game.awayTeam.displayName}
                </div>
                <div className="text-xs text-muted-foreground">{game.awayTeam.abbreviation}</div>
              </div>
            </div>
            <div className="text-3xl font-bold">{game.score.away}</div>
          </div>

          {/* Home Team */}
          <div
            className={cn(
              'flex items-center justify-between',
              possessionTeamId === game.homeTeam.id && 'bg-green-600/10 rounded-lg p-2 -m-2'
            )}
          >
            <div className="flex items-center gap-3">
              {game.homeTeam.logo && (
                <img
                  src={game.homeTeam.logo}
                  alt={game.homeTeam.abbreviation}
                  className="w-12 h-12"
                />
              )}
              <div>
                <div
                  className={cn(
                    'font-bold text-lg',
                    possessionTeamId === game.homeTeam.id && 'text-green-600'
                  )}
                >
                  {game.homeTeam.displayName}
                </div>
                <div className="text-xs text-muted-foreground">{game.homeTeam.abbreviation}</div>
              </div>
            </div>
            <div className="text-3xl font-bold">{game.score.home}</div>
          </div>

          {/* Game Status - Only show for non-live games */}
          {!game.isLive && (
            <div className="text-center pt-2 border-t">
              <div className="text-sm font-medium">
                <span>{game.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Game Clock */}
      {game.isLive && game.clock && game.period && (
        <div className="bg-green-600 text-white rounded-lg p-1.5 text-center">
          <div className="text-xl font-bold tabular-nums">{game.clock}</div>
          <div className="text-xs font-medium">Quarter {game.period}</div>
        </div>
      )}

      {/* Current Drive */}
      {currentDrive && (
        <div className="bg-card rounded-lg p-3 border border-green-600/20">
          <div className="text-xs text-muted-foreground mb-1">CURRENT DRIVE</div>
          <div className="text-sm font-bold text-green-600">
            {currentDrive.team.abbreviation}: {currentDrive.description}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {(['overview', 'boxscore', 'leaders', 'scoring', 'drives'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-colors border-b-2 capitalize whitespace-nowrap',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'boxscore' ? 'Box Score' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="bg-card rounded-lg p-3 space-y-2">
            <h3 className="font-semibold">Game Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Venue:</span>
                <div>{game.venue?.name}</div>
              </div>
              {game.venue?.city && (
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <div>
                    {game.venue.city}, {game.venue.state}
                  </div>
                </div>
              )}
              {game.broadcasts.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Broadcast:</span>
                  <div>{game.broadcasts.map((b) => b.network).join(', ')}</div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Attendance:</span>
                <div>{game.metadata.attendance?.toLocaleString() || 'N/A'}</div>
              </div>
            </div>
          </div>

          {game.score.periods.length > 0 && (
            <div className="bg-card rounded-lg p-3">
              <h3 className="font-semibold mb-2">Score by Quarter</h3>
              <div className="grid grid-cols-5 gap-2 text-sm text-center">
                <div className="font-medium">Team</div>
                {game.score.periods.map((_, i) => (
                  <div key={i} className="font-medium">
                    Q{i + 1}
                  </div>
                ))}
                <div className="font-medium">Total</div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-sm text-center mt-1">
                <div className="text-left">{game.awayTeam.abbreviation}</div>
                {game.score.periods.map((period, i) => (
                  <div key={i}>{period.away}</div>
                ))}
                <div className="font-bold">{game.score.away}</div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-sm text-center mt-1">
                <div className="text-left">{game.homeTeam.abbreviation}</div>
                {game.score.periods.map((period, i) => (
                  <div key={i}>{period.home}</div>
                ))}
                <div className="font-bold">{game.score.home}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Box Score Tab */}
      {activeTab === 'boxscore' && summaryData?.boxscore && summaryData.boxscore.length === 2 && (
        <div className="bg-card rounded-lg p-3">
          {/* Team Logos Header */}
          <div className="grid grid-cols-3 gap-2 pb-3 mb-3 border-b">
            <div className="flex justify-center">
              <img
                src={summaryData.boxscore[0].team.logo}
                alt={summaryData.boxscore[0].team.abbreviation}
                className="w-8 h-8"
              />
            </div>
            <div className="text-xs text-muted-foreground text-center self-center">TEAM STATS</div>
            <div className="flex justify-center">
              <img
                src={summaryData.boxscore[1].team.logo}
                alt={summaryData.boxscore[1].team.abbreviation}
                className="w-8 h-8"
              />
            </div>
          </div>

          <div className="space-y-1">
            {summaryData.boxscore[0].statistics.map((stat, i) => {
              const awayStat = summaryData.boxscore[0].statistics[i];
              const homeStat = summaryData.boxscore[1].statistics[i];

              return (
                <div
                  key={`${stat.name}-${i}`}
                  className="grid grid-cols-3 gap-2 items-center text-sm py-2 border-b last:border-0"
                >
                  <div className="text-center font-medium">{awayStat?.displayValue || '-'}</div>
                  <div className="text-xs text-muted-foreground text-center whitespace-nowrap">
                    {stat.label}
                  </div>
                  <div className="text-center font-medium">{homeStat?.displayValue || '-'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaders Tab */}
      {activeTab === 'leaders' && summaryData?.leaders && summaryData.leaders.length === 2 && (
        <div className="space-y-4">
          {summaryData.leaders[0].leaders.map((category, categoryIndex) => {
            const awayCategory = summaryData.leaders[0].leaders[categoryIndex];
            const homeCategory = summaryData.leaders[1].leaders[categoryIndex];
            const awayLeader = awayCategory?.leaders?.[0];
            const homeLeader = homeCategory?.leaders?.[0];

            return (
              <div key={category.name} className="bg-card rounded-lg p-3">
                {/* Header with Team Logos and Stat Name */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <img
                    src={summaryData.leaders[0].team.logo}
                    alt={summaryData.leaders[0].team.abbreviation}
                    className="w-6 h-6"
                  />
                  <div className="text-xs font-semibold text-muted-foreground uppercase">
                    {category.displayName}
                  </div>
                  <img
                    src={summaryData.leaders[1].team.logo}
                    alt={summaryData.leaders[1].team.abbreviation}
                    className="w-6 h-6"
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                  {/* Away Team Leader */}
                  <div className="flex items-center gap-2 justify-end">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {awayLeader?.athlete.displayName || '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {awayLeader?.displayValue || '-'}
                      </div>
                    </div>
                    {awayLeader?.athlete.headshot && (
                      <img
                        src={awayLeader.athlete.headshot}
                        alt={awayLeader.athlete.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                  </div>

                  {/* VS Divider */}
                  <div className="flex items-center justify-center pt-2">
                    <span className="text-xs text-muted-foreground font-semibold">VS</span>
                  </div>

                  {/* Home Team Leader */}
                  <div className="flex items-center gap-2">
                    {homeLeader?.athlete.headshot && (
                      <img
                        src={homeLeader.athlete.headshot}
                        alt={homeLeader.athlete.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {homeLeader?.athlete.displayName || '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {homeLeader?.displayValue || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scoring Plays Tab */}
      {activeTab === 'scoring' && summaryData?.scoringPlays && (
        <div className="space-y-2">
          {summaryData.scoringPlays.map((play) => (
            <div key={play.id} className="bg-card rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                    Q{play.period} {play.clock}
                  </span>
                  <span className="text-xs font-medium">{play.type}</span>
                </div>
                <div className="text-sm font-bold">
                  {play.awayScore} - {play.homeScore}
                </div>
              </div>
              <div className="text-sm">{play.text}</div>
              <div className="text-xs text-muted-foreground mt-1">{play.team.displayName}</div>
            </div>
          ))}
        </div>
      )}

      {/* Drives Tab */}
      {activeTab === 'drives' && summaryData?.drives && (
        <div className="space-y-2">
          {summaryData.drives.current && (
            <div className="bg-card rounded-lg p-3 border-l-2 border-red-500">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-red-500/20 text-red-600">
                  CURRENT DRIVE
                </span>
                <span className="text-sm font-medium">
                  {summaryData.drives.current.team.abbreviation}
                </span>
              </div>
              <div className="text-sm">{summaryData.drives.current.description}</div>
            </div>
          )}
          {summaryData.drives.previous.map((drive) => (
            <div key={drive.id} className="bg-card rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{drive.team.abbreviation}</span>
                {drive.result && (
                  <span className="text-xs px-2 py-1 rounded bg-muted">{drive.result}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{drive.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
