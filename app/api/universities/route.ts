import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("name") || "";
  if (!query.trim()) return NextResponse.json([]);

  const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`);
  const data = await res.json();
  return NextResponse.json(data.slice(0, 8));
}
