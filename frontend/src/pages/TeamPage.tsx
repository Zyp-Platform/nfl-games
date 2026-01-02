import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTeamGames, useTeamDetails, useTeamStatistics } from '../lib/queries';
import { GameCard } from '../components/GameCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

type Tab = 'schedule' | 'roster' | 'stats' | 'injuries' | 'info';

export function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<Tab>('schedule');

  const {
    data: gamesData,
    isLoading: gamesLoading,
    error: gamesError,
    refetch: refetchGames,
  } = useTeamGames(teamId, currentYear);
  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError,
    refetch: refetchTeam,
  } = useTeamDetails(teamId);
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useTeamStatistics(teamId);

  const isLoading = gamesLoading || teamLoading;
  const error = gamesError || teamError;

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
        <div className="flex-1">
          {teamData?.team && (
            <div className="flex items-center gap-2">
              {teamData.team.logo && (
                <img
                  src={teamData.team.logo}
                  alt={teamData.team.abbreviation}
                  className="w-10 h-10 object-contain"
                />
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight">{teamData.team.displayName}</h1>
                {teamData.record && (
                  <p className="text-xs text-muted-foreground">
                    {teamData.record.summary} • {teamData.record.pointDifferential > 0 ? '+' : ''}
                    {teamData.record.pointDifferential} PD
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {(['schedule', 'roster', 'stats', 'injuries', 'info'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 capitalize whitespace-nowrap',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && <LoadingSpinner />}
      {error && (
        <ErrorMessage
          error={error}
          retry={() => {
            refetchGames();
            refetchTeam();
          }}
        />
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && gamesData && (
        <div className="space-y-3">
          {(() => {
            // Group by season first
            const gamesBySeason = gamesData.games.reduce(
              (acc, game) => {
                const season = game.metadata.season;
                if (!acc[season]) acc[season] = [];
                acc[season].push(game);
                return acc;
              },
              {} as Record<number, typeof gamesData.games>
            );

            const sortedSeasons = Object.keys(gamesBySeason)
              .map(Number)
              .sort((a, b) => b - a);

            return sortedSeasons.map((season) => {
              const seasonGames = gamesBySeason[season];

              // Group by season type
              const gamesBySeasonType = seasonGames.reduce(
                (acc, game) => {
                  const seasonType = game.metadata.seasonType;
                  if (!acc[seasonType]) acc[seasonType] = [];
                  acc[seasonType].push(game);
                  return acc;
                },
                {} as Record<string, typeof gamesData.games>
              );

              const seasonTypeOrder = ['postseason', 'regular', 'preseason'];
              const sortedSeasonTypes = Object.entries(gamesBySeasonType).sort(
                ([a], [b]) => seasonTypeOrder.indexOf(a) - seasonTypeOrder.indexOf(b)
              );

              return (
                <div key={season} className="space-y-3">
                  <h2 className="text-lg font-bold">{season} Season</h2>
                  {sortedSeasonTypes.map(([seasonType, games]) => (
                    <div key={`${season}-${seasonType}`} className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground/80 px-1">
                        {seasonType === 'regular'
                          ? 'Regular Season'
                          : seasonType === 'preseason'
                            ? 'Preseason'
                            : 'Postseason'}
                      </h3>
                      <div className="space-y-1">
                        {games
                          .sort(
                            (a, b) =>
                              new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
                          )
                          .map((game) => (
                            <GameCard key={game.id} game={game} />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Roster Tab */}
      {activeTab === 'roster' && teamData?.roster && (
        <div className="space-y-4">
          {teamData.roster.map((positionGroup) => (
            <div key={positionGroup.position} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground/80 px-1">
                {positionGroup.position}
              </h3>
              <div className="space-y-1">
                {positionGroup.items.map((player) => (
                  <div
                    key={player.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded bg-card hover:bg-muted transition-colors',
                      player.injuries.length > 0 && 'border-l-2 border-red-500'
                    )}
                  >
                    {player.headshot && (
                      <img
                        src={player.headshot}
                        alt={player.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-muted-foreground w-6">
                          #{player.jersey}
                        </span>
                        <span className="text-sm font-medium">{player.displayName}</span>
                        <span className="text-xs text-muted-foreground">{player.position}</span>
                        {player.injuries.length > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 font-medium">
                            {player.injuries[0].status}
                          </span>
                        )}
                        {player.status && player.status !== 'Active' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {player.status}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {player.height} • {player.weight} • {player.age}y • Exp:{' '}
                        {player.experience || 'R'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {player.college}
                        {player.birthPlace &&
                          ` • ${player.birthPlace.city}, ${player.birthPlace.state}`}
                        {player.debutYear && ` • Debut: ${player.debutYear}`}
                      </div>
                      {player.injuries.length > 0 && player.injuries[0].description && (
                        <div className="text-xs text-red-600 mt-1">
                          {player.injuries[0].description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {statsLoading && <LoadingSpinner />}
          {statsError && <ErrorMessage error={statsError} retry={refetchStats} />}

          {statsData && (
            <>
              {/* Offensive Stats */}
              <div className="bg-card rounded-lg p-4 space-y-3">
                <h3 className="text-lg font-bold">Offensive Statistics</h3>
                <div className="space-y-2">
                  {/* Passing Stats */}
                  {statsData.statistics.passing?.stats &&
                    statsData.statistics.passing.stats.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Passing
                        </h4>
                        <div className="space-y-1">
                          {statsData.statistics.passing.stats
                            .filter((stat) =>
                              [
                                'passingYards',
                                'yardsPerPassAttempt',
                                'completionPct',
                                'passerRating',
                              ].includes(stat.name)
                            )
                            .map((stat) => (
                              <div
                                key={stat.name}
                                className="flex justify-between items-center text-sm py-1 border-b last:border-0"
                              >
                                <span className="text-muted-foreground">{stat.displayName}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{stat.displayValue}</span>
                                  {stat.rankDisplayValue && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                      {stat.rankDisplayValue}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Rushing Stats */}
                  {statsData.statistics.rushing?.stats &&
                    statsData.statistics.rushing.stats.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Rushing
                        </h4>
                        <div className="space-y-1">
                          {statsData.statistics.rushing.stats
                            .filter((stat) =>
                              ['rushingYards', 'yardsPerRushAttempt', 'rushingTouchdowns'].includes(
                                stat.name
                              )
                            )
                            .map((stat) => (
                              <div
                                key={stat.name}
                                className="flex justify-between items-center text-sm py-1 border-b last:border-0"
                              >
                                <span className="text-muted-foreground">{stat.displayName}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{stat.displayValue}</span>
                                  {stat.rankDisplayValue && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                      {stat.rankDisplayValue}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* General Offensive Stats */}
                  {statsData.statistics.general?.stats &&
                    statsData.statistics.general.stats.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Total Offense
                        </h4>
                        <div className="space-y-1">
                          {statsData.statistics.general.stats
                            .filter((stat) =>
                              ['totalYards', 'yardsPerPlay', 'totalTouchdowns'].includes(stat.name)
                            )
                            .map((stat) => (
                              <div
                                key={stat.name}
                                className="flex justify-between items-center text-sm py-1 border-b last:border-0"
                              >
                                <span className="text-muted-foreground">{stat.displayName}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{stat.displayValue}</span>
                                  {stat.rankDisplayValue && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                      {stat.rankDisplayValue}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Defensive Stats */}
              {statsData.statistics.defensive?.stats &&
                statsData.statistics.defensive.stats.length > 0 && (
                  <div className="bg-card rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-bold">Defensive Statistics</h3>
                    <div className="space-y-1">
                      {statsData.statistics.defensive.stats
                        .filter((stat) =>
                          [
                            'totalYardsAllowed',
                            'yardsPerPlayAllowed',
                            'sacks',
                            'interceptions',
                            'fumblesRecovered',
                          ].includes(stat.name)
                        )
                        .map((stat) => (
                          <div
                            key={stat.name}
                            className="flex justify-between items-center text-sm py-1 border-b last:border-0"
                          >
                            <span className="text-muted-foreground">{stat.displayName}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{stat.displayValue}</span>
                              {stat.rankDisplayValue && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                  {stat.rankDisplayValue}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Scoring Stats */}
              {statsData.statistics.scoring?.stats &&
                statsData.statistics.scoring.stats.length > 0 && (
                  <div className="bg-card rounded-lg p-4 space-y-3">
                    <h3 className="text-lg font-bold">Scoring</h3>
                    <div className="space-y-1">
                      {statsData.statistics.scoring.stats
                        .filter((stat) =>
                          ['avgPointsPerGame', 'avgPointsAllowedPerGame'].includes(stat.name)
                        )
                        .map((stat) => (
                          <div
                            key={stat.name}
                            className="flex justify-between items-center text-sm py-1 border-b last:border-0"
                          >
                            <span className="text-muted-foreground">{stat.displayName}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{stat.displayValue}</span>
                              {stat.rankDisplayValue && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                  {stat.rankDisplayValue}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {/* Injuries Tab */}
      {activeTab === 'injuries' && teamData?.roster && (
        <div className="space-y-2">
          {(() => {
            // Filter all injured players from the roster
            const injuredPlayers = teamData.roster.flatMap((positionGroup) =>
              positionGroup.items
                .filter((player) => player.injuries.length > 0)
                .map((player) => ({ ...player, position: positionGroup.position }))
            );

            if (injuredPlayers.length === 0) {
              return (
                <div className="bg-card rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">No players currently on injury report</p>
                </div>
              );
            }

            return injuredPlayers.map((player) => (
              <div key={player.id} className="bg-card rounded-lg p-3 border-l-4 border-red-500">
                <div className="flex items-center gap-3">
                  {player.headshot && (
                    <img
                      src={player.headshot}
                      alt={player.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">#{player.jersey}</span>
                      <span className="font-medium">{player.displayName}</span>
                      <span className="text-xs text-muted-foreground">{player.position}</span>
                      <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-600 font-medium">
                        {player.injuries[0].status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {player.injuries[0].details && (
                        <span className="font-medium">{player.injuries[0].details}</span>
                      )}
                      {player.injuries[0].date && (
                        <span className="ml-2">
                          • {new Date(player.injuries[0].date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {player.injuries[0].description && (
                      <div className="text-sm text-red-600 mt-1">
                        {player.injuries[0].description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Info Tab */}
      {activeTab === 'info' && teamData && (
        <div className="space-y-4">
          {/* Record Stats */}
          {teamData.record && (
            <div className="bg-card rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-bold">Season Record</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Overall:</span>
                  <span className="ml-2 font-semibold">{teamData.record.summary}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Win %:</span>
                  <span className="ml-2 font-semibold">
                    {(teamData.record.winPercent * 100).toFixed(1)}%
                  </span>
                </div>
                {teamData.record.home && (
                  <div>
                    <span className="text-muted-foreground">Home:</span>
                    <span className="ml-2 font-semibold">{teamData.record.home.summary}</span>
                  </div>
                )}
                {teamData.record.away && (
                  <div>
                    <span className="text-muted-foreground">Away:</span>
                    <span className="ml-2 font-semibold">{teamData.record.away.summary}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Points For:</span>
                  <span className="ml-2 font-semibold">{teamData.record.pointsFor}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Points Against:</span>
                  <span className="ml-2 font-semibold">{teamData.record.pointsAgainst}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Differential:</span>
                  <span
                    className={cn(
                      'ml-2 font-semibold',
                      teamData.record.pointDifferential > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {teamData.record.pointDifferential > 0 ? '+' : ''}
                    {teamData.record.pointDifferential}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Streak:</span>
                  <span className="ml-2 font-semibold">
                    {teamData.record.streak > 0
                      ? `W${teamData.record.streak}`
                      : `L${Math.abs(teamData.record.streak)}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Team Info */}
          <div className="bg-card rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-bold">Team Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Full Name:</span>
                <span className="ml-2">{teamData.team.displayName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>
                <span className="ml-2">{teamData.team.location}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Abbreviation:</span>
                <span className="ml-2">{teamData.team.abbreviation}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Colors:</span>
                <div className="flex items-center gap-1">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: `#${teamData.team.color}` }}
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: `#${teamData.team.alternateColor}` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
