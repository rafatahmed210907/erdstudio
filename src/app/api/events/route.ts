import { connection } from "next/server";
import { getRepository, watchDatabase } from "@/lib/data/json-repository";

export async function GET() {
  await connection();
  const encoder = new TextEncoder();
  let stop = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (revision: number) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ revision })}\n\n`));
      };
      getRepository()
        .getSnapshot()
        .then((snapshot) => send(snapshot.revision))
        .catch(() => undefined);
      const unwatch = watchDatabase(send);
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);
      stop = () => {
        clearInterval(heartbeat);
        unwatch();
      };
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
