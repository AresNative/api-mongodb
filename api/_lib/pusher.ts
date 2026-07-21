import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export default pusher;

export async function notifyChange(
  collection: string,
  operation: "created" | "updated" | "deleted",
  id: string,
  data?: any,
) {
  const channel = `collection-${collection}`;
  await pusher.trigger(channel, operation, {
    collection,
    operation,
    id,
    data,
    timestamp: new Date().toISOString(),
  });
}
