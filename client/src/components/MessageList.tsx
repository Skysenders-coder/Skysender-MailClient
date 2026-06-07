import { useMessages } from '../hooks/useMessages';

interface Props {
  folder: string;
  page: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPageChange: (page: number) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessageList({ folder, page, selectedId, onSelect, onPageChange }: Props) {
  const { data, isLoading, isError } = useMessages(folder, page);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-sm text-red-600">Failed to load messages.</div>;
  }

  const { messages = [], total = 0, pageSize = 50 } = data ?? {};
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (messages.length === 0) {
    return <div className="p-4 text-sm text-gray-500">No messages.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {messages.map((msg) => (
          <button
            key={msg.id}
            onClick={() => onSelect(msg.id)}
            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              selectedId === msg.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span
                className={`text-sm truncate max-w-[160px] ${
                  !msg.seen ? 'font-semibold text-gray-900' : 'text-gray-700'
                }`}
              >
                {msg.from.name || msg.from.address}
              </span>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                {formatDate(msg.date)}
              </span>
            </div>
            <div
              className={`text-sm truncate ${
                !msg.seen ? 'font-medium text-gray-800' : 'text-gray-600'
              }`}
            >
              {msg.subject}
            </div>
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="text-xs text-gray-600 disabled:opacity-40 hover:text-gray-900"
          >
            ← Newer
          </button>
          <span className="text-xs text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="text-xs text-gray-600 disabled:opacity-40 hover:text-gray-900"
          >
            Older →
          </button>
        </div>
      )}
    </div>
  );
}
