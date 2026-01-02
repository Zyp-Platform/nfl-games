import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

// NFL Teams data
const nflTeams = [
  // AFC East
  {
    id: '2',
    abbr: 'BUF',
    name: 'Bills',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/buf.png',
  },
  {
    id: '15',
    abbr: 'MIA',
    name: 'Dolphins',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/mia.png',
  },
  {
    id: '20',
    abbr: 'NE',
    name: 'Patriots',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ne.png',
  },
  {
    id: '21',
    abbr: 'NYJ',
    name: 'Jets',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/nyj.png',
  },
  // AFC North
  {
    id: '33',
    abbr: 'BAL',
    name: 'Ravens',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/bal.png',
  },
  {
    id: '4',
    abbr: 'CIN',
    name: 'Bengals',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/cin.png',
  },
  {
    id: '5',
    abbr: 'CLE',
    name: 'Browns',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/cle.png',
  },
  {
    id: '23',
    abbr: 'PIT',
    name: 'Steelers',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/pit.png',
  },
  // AFC South
  {
    id: '34',
    abbr: 'HOU',
    name: 'Texans',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/hou.png',
  },
  {
    id: '11',
    abbr: 'IND',
    name: 'Colts',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ind.png',
  },
  {
    id: '30',
    abbr: 'JAX',
    name: 'Jaguars',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/jax.png',
  },
  {
    id: '10',
    abbr: 'TEN',
    name: 'Titans',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ten.png',
  },
  // AFC West
  {
    id: '7',
    abbr: 'DEN',
    name: 'Broncos',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/den.png',
  },
  {
    id: '12',
    abbr: 'KC',
    name: 'Chiefs',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/kc.png',
  },
  {
    id: '13',
    abbr: 'LV',
    name: 'Raiders',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/lv.png',
  },
  {
    id: '24',
    abbr: 'LAC',
    name: 'Chargers',
    conference: 'AFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/lac.png',
  },
  // NFC East
  {
    id: '6',
    abbr: 'DAL',
    name: 'Cowboys',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/dal.png',
  },
  {
    id: '19',
    abbr: 'NYG',
    name: 'Giants',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/nyg.png',
  },
  {
    id: '28',
    abbr: 'PHI',
    name: 'Eagles',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/phi.png',
  },
  {
    id: '17',
    abbr: 'WSH',
    name: 'Commanders',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/wsh.png',
  },
  // NFC North
  {
    id: '3',
    abbr: 'CHI',
    name: 'Bears',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/chi.png',
  },
  {
    id: '8',
    abbr: 'DET',
    name: 'Lions',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/det.png',
  },
  {
    id: '9',
    abbr: 'GB',
    name: 'Packers',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/gb.png',
  },
  {
    id: '16',
    abbr: 'MIN',
    name: 'Vikings',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/min.png',
  },
  // NFC South
  {
    id: '1',
    abbr: 'ATL',
    name: 'Falcons',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/atl.png',
  },
  {
    id: '29',
    abbr: 'CAR',
    name: 'Panthers',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/car.png',
  },
  {
    id: '18',
    abbr: 'NO',
    name: 'Saints',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/no.png',
  },
  {
    id: '27',
    abbr: 'TB',
    name: 'Buccaneers',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/tb.png',
  },
  // NFC West
  {
    id: '22',
    abbr: 'ARI',
    name: 'Cardinals',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ari.png',
  },
  {
    id: '14',
    abbr: 'LAR',
    name: 'Rams',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/lar.png',
  },
  {
    id: '25',
    abbr: 'SF',
    name: '49ers',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/sf.png',
  },
  {
    id: '26',
    abbr: 'SEA',
    name: 'Seahawks',
    conference: 'NFC',
    logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/sea.png',
  },
];

type Conference = 'All' | 'AFC' | 'NFC';

export function TeamsPage() {
  const [selectedConference, setSelectedConference] = useState<Conference>('All');
  const navigate = useNavigate();

  const filteredTeams =
    selectedConference === 'All'
      ? nflTeams
      : nflTeams.filter((team) => team.conference === selectedConference);

  return (
    <div className="container mx-auto px-2 py-3 pb-20 space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">NFL Teams</h1>
        <p className="text-sm text-muted-foreground">Select a team to view their schedule</p>
      </div>

      {/* Conference Filter */}
      <div className="flex gap-2">
        {(['All', 'AFC', 'NFC'] as Conference[]).map((conf) => (
          <button
            key={conf}
            onClick={() => setSelectedConference(conf)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedConference === conf
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {conf}
          </button>
        ))}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-4 gap-2">
        {filteredTeams.map((team) => (
          <button
            key={team.id}
            onClick={() => navigate(`/team/${team.id}`)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-16 h-16 flex items-center justify-center">
              <img src={team.logo} alt={team.abbr} className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold text-center">{team.abbr}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
