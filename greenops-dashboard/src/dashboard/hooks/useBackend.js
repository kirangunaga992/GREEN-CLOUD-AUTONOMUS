import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export function useDashboardData() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [scalingEvents, setScalingEvents] = useState([]);

  const fetchData = async () => {
    try {
      const kpiRes = await fetch(API_URL + "/api/dashboard/summary");
      if (kpiRes.ok) setData(await kpiRes.json());

      const userRes = await fetch(API_URL + "/api/users/all");
      if (userRes.ok) {
        const raw = await userRes.json();
        const list = Array.isArray(raw) ? raw : (raw.users || raw.data || []);
        setUsers(list);
      }

      const scaleRes = await fetch(API_URL + "/api/scaling/events");
      if (scaleRes.ok) {
        const ev = await scaleRes.json();
        setScalingEvents(ev.events || ev || []);
      }
    } catch (err) {
      console.warn("Backend error:", err.message);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 3000);
    return () => clearInterval(id);
  }, []);

  return { data, users, scalingEvents, API_URL };
}
