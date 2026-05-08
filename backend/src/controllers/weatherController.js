import "dotenv/config";

export const getWeather = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Thiếu tọa độ" });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: "Server chưa cấu hình API Key thời tiết. Vui lòng thêm OPENWEATHER_API_KEY vào .env" 
      });
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=vi`
    );
    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ success: true, data });
    } else {
      res.status(response.status).json({ 
        success: false, 
        message: data.message || "Lỗi từ dịch vụ thời tiết" 
      });
    }
  } catch (error) {
    console.error("Weather Error:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const getTile = async (req, res) => {
  try {
    const { layer, z, x, y } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(500).send("API Key missing");
    }

    const tileUrl = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`;
    const response = await fetch(tileUrl);

    if (!response.ok) {
      return res.status(response.status).send("Error fetching tile");
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache 1h
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Tile Error:", error);
    res.status(500).send("Server Error");
  }
};
