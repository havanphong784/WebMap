import {useState} from "react";
import {searchAddress} from "../../utils/Map.jsx";

export default function SearchBox({onSelectLocation}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    const data = await searchAddress(query);
    setResults(data);
    setIsLoading(false);
  };

  return (
    <div
      className="absolute top-4 left-4 right-14 md:left-1/2 md:-translate-x-1/2 md:right-auto z-[100] w-auto md:w-full md:max-w-md">
      {/* Search Input Container */}
      <form
        onSubmit={handleSearch}
        className="relative flex rounded-xl overflow-hidden bg-zinc-900/90 backdrop-blur-md border border-white/20 shadow-2xl shadow-black/50"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập địa điểm..."
          className="w-full px-4 py-3 bg-transparent text-white placeholder-zinc-400 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 font-semibold transition-all duration-200 active:scale-95"
        >
          {isLoading ? "⏳" : "Tìm"}
        </button>
      </form>

      {/* Results List */}
      {results.length > 0 && (
        <ul
          className="mt-2 bg-zinc-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 overflow-hidden max-h-60 overflow-y-auto">
          {results.map((item, index) => (
            <li
              key={index}
              onClick={() => {
                onSelectLocation(parseFloat(item.lon), parseFloat(item.lat), item.display_name);
                setResults([]);
                setQuery(item.display_name.split(',')[0]);
              }}
              className="px-4 py-3 border-b border-white/10 last:border-b-0 hover:bg-white/10 cursor-pointer text-sm text-zinc-200 transition-colors"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}