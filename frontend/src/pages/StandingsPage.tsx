import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStandings } from '../lib/queries';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { cn } from '../lib/utils';

type Conference = 'AFC' | 'NFC';

export function StandingsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedConference, setSelectedConference] = useState<Conference>('AFC');
  const { data, isLoading, error, refetch } = useStandings(currentYear);
  const navigate = useNavigate();

  const conference = data?.conferences.find((c) => c.abbreviation === selectedConference);
  const divisionOrder = ['East', 'North', 'South', 'West'];

  return (
    <div className="container mx-auto px-2 py-3 pb-20 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Standings</h1>
        <span className="text-sm text-muted-foreground">{data?.season || currentYear} Season</span>
      </div>

      {/* Conference Tabs */}
      <div className="flex gap-2 border-b">
        {(['AFC', 'NFC'] as Conference[]).map((conf) => (
          <button
            key={conf}
            onClick={() => setSelectedConference(conf)}
            className={cn(
              'px-6 py-2 text-sm font-medium transition-colors border-b-2',
              selectedConference === conf
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {conf}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} retry={() => refetch()} />}

      {conference && (
        <div className="space-y-4">
          {divisionOrder.map((division) => {
            const teams = conference.divisions[division];
            if (!teams || teams.length === 0) return null;

            return (
              <div key={division} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground/80 px-1">
                  {selectedConference} {division}
                </h3>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 pb-1 border-b">
                  <div className="col-span-6">TEAM</div>
                  <div className="col-span-1 text-center">W</div>
                  <div className="col-span-1 text-center">L</div>
                  <div className="col-span-2 text-center">PCT</div>
                  <div className="col-span-2 text-center">STRK</div>
                </div>

                {/* Teams */}
                <div className="space-y-1">
                  {teams.map((entry, index) => (
                    <button
                      key={entry.team.id}
                      onClick={() => navigate(`/team/${entry.team.id}`)}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded hover:bg-muted transition-colors w-full text-left"
                    >
                      <div className="col-span-6 flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-4">
                          {index + 1}.
                        </span>
                        {entry.team.logo && (
                          <img
                            src={entry.team.logo}
                            alt={entry.team.abbreviation}
                            className="w-5 h-5 object-contain"
                          />
                        )}
                        <span className="text-sm font-medium">{entry.team.abbreviation}</span>
                      </div>
                      <div className="col-span-1 text-center text-sm font-bold">
                        {entry.stats.wins}
                      </div>
                      <div className="col-span-1 text-center text-sm">{entry.stats.losses}</div>
                      <div className="col-span-2 text-center text-sm">{entry.stats.winPercent}</div>
                      <div className="col-span-2 text-center text-xs font-medium text-muted-foreground">
                        {entry.stats.streak}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
