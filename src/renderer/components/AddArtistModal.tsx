import { useState } from "react";
import { X } from "lucide-react";

interface AddArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    tag: string,
    type: "tag" | "uploader" | "query"
  ) => void;
}

export function AddArtistModal({
  isOpen,
  onClose,
  onAdd,
}: AddArtistModalProps) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [type, setType] = useState<"tag" | "uploader" | "query">("tag");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && tag) {
      onAdd(name, tag, type);
      setName("");
      setTag("");
      setType("tag");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Track New Artist</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 0zmann"
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Booru Tag / Query
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. 0zmann (exact tag)"
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Tracker Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["tag", "uploader", "query"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                    type === t
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">
              {type === "tag" && "Tracks posts with a specific tag."}
              {type === "uploader" &&
                "Tracks posts uploaded by a specific user."}
              {type === "query" && "Advanced search query string."}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!name || !tag}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
            >
              Start Tracking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
