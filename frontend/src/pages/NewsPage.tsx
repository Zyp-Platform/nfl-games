import { useNews } from '../lib/queries';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatDistanceToNow } from 'date-fns';

export function NewsPage() {
  const { data, isLoading, error, refetch } = useNews(20);

  return (
    <div className="container mx-auto px-2 py-3 pb-20 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">NFL News</h1>
        <span className="text-xs text-muted-foreground">{data?.metadata.total || 0} articles</span>
      </div>

      {/* Content */}
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} retry={() => refetch()} />}

      {data && (
        <div className="space-y-2">
          {data.articles.map((article) => (
            <a
              key={article.id}
              href={article.links.web}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
            >
              <div className="flex gap-3">
                {article.images.length > 0 && (
                  <div className="flex-shrink-0">
                    <img
                      src={article.images[0].url}
                      alt={article.images[0].alt || article.headline}
                      className="w-24 h-24 rounded object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium uppercase">{article.type}</span>
                    {article.premium && (
                      <span className="px-1.5 py-0.5 rounded bg-yellow-600/20 text-yellow-600 font-medium">
                        Premium
                      </span>
                    )}
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(article.published), { addSuffix: true })}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold line-clamp-2">{article.headline}</h2>
                  {article.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  {article.categories.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {article.categories.slice(0, 3).map((category, index) => {
                        if (category.team) {
                          return (
                            <span
                              key={`${category.id}-${index}`}
                              className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium"
                            >
                              {category.team.abbreviation}
                            </span>
                          );
                        }
                        if (category.athlete) {
                          return (
                            <span
                              key={`${category.id}-${index}`}
                              className="text-xs px-2 py-0.5 rounded bg-muted text-foreground"
                            >
                              {category.athlete.displayName}
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
