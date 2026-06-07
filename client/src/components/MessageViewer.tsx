import { useMessage } from '../hooks/useMessage';
import type { MessageDetail } from '../types';

interface Props {
  folder: string;
  messageId: string | null;
  onReply: (msg: MessageDetail) => void;
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function addressLine(addrs: { name: string; address: string }[]): string {
  return addrs
    .map((a) => (a.name ? `${a.name} <${a.address}>` : a.address))
    .join(', ');
}

export default function MessageViewer({ folder, messageId, onReply }: Props) {
  const { data: msg, isLoading, isError } = useMessage(messageId, folder);

  if (!messageId) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400">
        Select a message to read
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-3 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
        <div className="mt-6 h-4 bg-gray-100 rounded" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
      </div>
    );
  }

  if (isError || !msg) {
    return (
      <div className="p-6 text-sm text-red-600">Failed to load message.</div>
    );
  }

  function handleReplyAll() {
    if (!msg) return;
    onReply({
      ...msg,
      to: [msg.from, ...msg.to.filter((t) => t.address !== msg.from.address)],
    });
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{msg.subject}</h2>

      <div className="text-sm text-gray-600 space-y-1 mb-4">
        <div>
          <span className="font-medium text-gray-700">From: </span>
          {msg.from.name ? `${msg.from.name} <${msg.from.address}>` : msg.from.address}
        </div>
        <div>
          <span className="font-medium text-gray-700">To: </span>
          {addressLine(msg.to)}
        </div>
        {msg.cc.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">CC: </span>
            {addressLine(msg.cc)}
          </div>
        )}
        <div>
          <span className="font-medium text-gray-700">Date: </span>
          {formatFull(msg.date)}
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => onReply(msg)}
          className="text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
        >
          Reply
        </button>
        <button
          onClick={handleReplyAll}
          className="text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
        >
          Reply All
        </button>
      </div>

      <div className="border-t border-gray-200 pt-4">
        {msg.htmlBody ? (
          <div
            className="prose prose-sm max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: msg.htmlBody }}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
            {msg.textBody || '(empty)'}
          </pre>
        )}
      </div>
    </div>
  );
}
