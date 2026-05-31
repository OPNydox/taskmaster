import { getTokenMetrics } from "@taskmaster/core";
import { errorResponse, jsonResponse, requireProjectRoot } from "@/lib/project";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const projectRoot = await requireProjectRoot();
    const { id } = await params;
    const metrics = await getTokenMetrics(projectRoot, id);
    return jsonResponse({ metrics });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to get metrics",
      500,
    );
  }
}
