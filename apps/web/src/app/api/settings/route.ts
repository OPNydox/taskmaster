import { loadSettings, saveSettings } from "@/lib/settings";

export async function GET() {
  const settings = await loadSettings();
  return Response.json(settings);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const current = await loadSettings();
  const updated = {
    ...current,
    ...(body.cursorApiKey !== undefined
      ? { cursorApiKey: body.cursorApiKey }
      : {}),
  };
  await saveSettings(updated);
  return Response.json(updated);
}
