const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const MPLADS_API_KEY = process.env.MPLADS_API_KEY;

async function predict(req, res) {
    try {
        const workData = req.body;

        if (!MPLADS_API_KEY) {
            console.error("MPLADS_API_KEY not configured");
            return res.status(500).json({ error: "ML service not configured" });
        }

        const response = await fetch(`${FASTAPI_URL}/api/score`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": MPLADS_API_KEY,
            },
            body: JSON.stringify(workData),
            timeout: 30000,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`FastAPI error: ${response.status} - ${errorText}`);

            if (response.status === 401) {
                return res.status(500).json({ error: "ML authentication failed" });
            }
            if (response.status === 422) {
                return res.status(400).json({ error: "Invalid project data for ML scoring", details: errorText });
            }
            if (response.status >= 500) {
                return res.status(502).json({ error: "ML service unavailable" });
            }
            return res.status(502).json({ error: "ML service error", details: errorText });
        }

        const mlResult = await response.json();
        return res.json(mlResult);
    } catch (err) {
        console.error("ML prediction error:", err);
        if (err.code === "ECONNREFUSED" || err.type === "system") {
            return res.status(503).json({ error: "ML service unavailable" });
        }
        if (err.name === "FetchError" || err.name === "TimeoutError") {
            return res.status(504).json({ error: "ML service timeout" });
        }
        return res.status(500).json({ error: "ML prediction failed" });
    }
}

module.exports = { predict };