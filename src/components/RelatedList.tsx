import { Link } from 'react-router-dom';
import { getPostHref } from '@/lib/blog';
import { getTagHref, relatedCreatedLabel, type RelatedGroup } from '@/lib/tags';
import { getTranslation } from '@/lib/translations';
import type { LanguageCode } from '@/lib/language';
import type { BlogPost } from '@/lib/blog';

interface RelatedListProps {
  groups: RelatedGroup[];
  language: LanguageCode;
  onNavigate?: () => void;
}

function RelatedItemCopy({ post, language, current }: { post: BlogPost; language: LanguageCode; current: boolean }) {
  return (
    <>
      {post.title}
      <time dateTime={post.create_time} className="block text-[11px] font-normal mt-0.5 text-muted-foreground">
        {relatedCreatedLabel(post.create_time, language)}
      </time>
      {current ? (
        <span className="block text-[11px] font-normal mt-0.5">
          {getTranslation(language, 'tags.current')}
        </span>
      ) : null}
    </>
  );
}

export default function RelatedList({ groups, language, onNavigate }: RelatedListProps) {
  return (
    <div>
      {groups.map((group, index) => (
        <div
          key={group.tag}
          className={index > 0 ? 'border-t border-slate-200 dark:border-slate-700 pt-3.5 mt-3.5' : undefined}
        >
          <Link
            to={getTagHref(group.tag, language)}
            onClick={onNavigate}
            className="flex justify-between items-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5 break-words"
          >
            <span className="min-w-0">{group.tag}</span>
            <span aria-hidden="true">↗</span>
          </Link>
          {group.articles.map((article) =>
            article.current ? (
              <div
                key={article.post.url}
                aria-current="page"
                className="rounded-md px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 text-[13px] leading-5 font-medium break-words"
              >
                <RelatedItemCopy post={article.post} language={language} current />
              </div>
            ) : (
              <Link
                key={article.post.url}
                to={getPostHref(article.post, language)}
                onClick={onNavigate}
                className="block rounded-md px-3 py-2 text-[13px] leading-5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 break-words"
              >
                <RelatedItemCopy post={article.post} language={language} current={false} />
              </Link>
            ),
          )}
        </div>
      ))}
    </div>
  );
}
