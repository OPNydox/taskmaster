import { appendWorklog, listWorklogEvents } from "@taskmaster/core";
import { errorResponse, jsonResponse, requireProjectRoot } from "@/lib/project";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const projectRoot = await requireProjectRoot();
    const { id } = await params;
    const events = await listWorklogEvents(projectRoot, id);
    return jsonResponse({ events });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to list worklog",
      500,
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const projectRoot = await requireProjectRoot();
    const { id } = await params;
    const body = await request.json();
    const event = await appendWorklog(projectRoot, id, body);
    return jsonResponse({ event }, 201);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to append worklog",
      400,
    );
  }
}
