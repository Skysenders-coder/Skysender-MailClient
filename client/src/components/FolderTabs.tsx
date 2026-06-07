import type { MailFolder } from '../types';

interface Props {
  folders: MailFolder[];
  selected: string;
  onSelect: (id: string) => void;
  onCompose: () => void;
}

export default function FolderTabs({ folders, selected, onSelect, onCompose }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex">
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              selected === f.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {f.name}
            {f.unseen > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                {f.unseen}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onCompose}
        className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
      >
        New Email
      </button>
    </div>
  );
}
