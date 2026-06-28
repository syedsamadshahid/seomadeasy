import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { encryptToken } from "@/lib/crypto/tokens";

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${APP_URL}/dashboard?gsc=denied`);
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const storedState = req.cookies.get("gsc_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 503 });
  }

  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    return NextResponse.redirect(`${APP_URL}/dashboard?gsc=no_refresh_token`);
  }

  const encryptedRefreshToken = encryptToken(tokens.refresh_token);

  const existing = await prisma.googleConnection.findFirst({ where: { userId: user.id } });
  if (existing) {
    await prisma.googleConnection.update({
      where: { id: existing.id },
      data: { encryptedRefreshToken, scopes: [GSC_SCOPE] },
    });
  } else {
    await prisma.googleConnection.create({
      data: { userId: user.id, encryptedRefreshToken, scopes: [GSC_SCOPE] },
    });
  }

  const response = NextResponse.redirect(`${APP_URL}/dashboard?gsc=connected`);
  response.cookies.delete("gsc_oauth_state");
  return response;
}
