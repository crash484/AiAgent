import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadMessage,
} from "@assistant-ui/react";
import { Thread } from "./Thread";

import { chatModelAdapter } from "./utils";

interface ChatProps {
  initialMessages: ThreadMessage[];
}

export function Chat({ initialMessages }: ChatProps) {
  const runtime = useLocalRuntime(chatModelAdapter, {
    initialMessages,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-screen flex flex-col bg-white">
        <header className="border-b px-4 py-3 flex-shrink-0">
          <h1 className="text-lg font-semibold">Support Agent</h1>
        </header>
        <main className="flex-1 overflow-hidden">
          <Thread />
        </main>
      </div>
    </AssistantRuntimeProvider>
  );
}
