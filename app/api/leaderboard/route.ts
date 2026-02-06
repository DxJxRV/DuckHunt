import { NextResponse } from "next/server";
import { getLeaderboard, addScore } from "@/lib/leaderboard";

export async function GET() {
  try {
    const leaderboard = getLeaderboard();
    return NextResponse.json(leaderboard);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, score } = await request.json();

    if (!name || typeof score !== "number") {
      return NextResponse.json(
        { error: "Invalid name or score" },
        { status: 400 }
      );
    }

    const leaderboard = addScore(name, score);
    return NextResponse.json(leaderboard);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save score" },
      { status: 500 }
    );
  }
}
