import fs from "fs";
import path from "path";

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

const LEADERBOARD_FILE = path.join(process.cwd(), "data", "leaderboard.json");
const MAX_ENTRIES = 10;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    if (!fs.existsSync(LEADERBOARD_FILE)) {
      fs.mkdirSync(path.dirname(LEADERBOARD_FILE), { recursive: true });
      fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([]));
      return [];
    }

    const data = fs.readFileSync(LEADERBOARD_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading leaderboard:", error);
    return [];
  }
}

export function addScore(name: string, score: number): LeaderboardEntry[] {
  try {
    const leaderboard = getLeaderboard();

    const newEntry: LeaderboardEntry = {
      name: name.trim().substring(0, 10).toUpperCase(), // Max 10 chars, uppercase
      score,
      date: new Date().toISOString(),
    };

    // Add and sort by score (descending)
    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep only top MAX_ENTRIES
    const topScores = leaderboard.slice(0, MAX_ENTRIES);

    // Save
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(topScores, null, 2));

    return topScores;
  } catch (error) {
    console.error("Error adding score:", error);
    throw error;
  }
}

export function isHighScore(score: number): boolean {
  const leaderboard = getLeaderboard();

  // If leaderboard not full, it's a high score
  if (leaderboard.length < MAX_ENTRIES) {
    return true;
  }

  // Check if score beats the lowest high score
  const lowestHighScore = leaderboard[leaderboard.length - 1].score;
  return score > lowestHighScore;
}
