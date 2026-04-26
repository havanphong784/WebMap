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
      <form onSubmit={handleSearch}
            className="relative flex shadow-lg rounded-xl overflow-hidden bg-white border border-gray-200">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập tên đường, thành phố..."
          className="w-full px-4 py-3 text-gray-700 outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 font-medium transition-colors"
        >
          {isLoading ? "⏳" : "Tìm"}
        </button>
      </form>

      {results.length > 0 && (
        <ul
          className="mt-2 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 max-h-60 overflow-y-auto">
          {results.map((item, index) => (
            <li
              key={index}
              onClick={() => {
                onSelectLocation(parseFloat(item.lon), parseFloat(item.lat), item.display_name);
                setResults([]);
                setQuery(item.display_name.split(',')[0]); // Rút gọn tên trên ô input
              }}
              className="px-4 py-3 border-b last:border-b-0 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 transition-colors"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
