import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { SendHorizontal } from "lucide-react";

export function Thread() {
  return (
    <ThreadPrimitive.Root className="flex flex-col h-full">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4">
        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>
      <Composer />
    </ThreadPrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end mb-4">
      <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-start mb-4">
      <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%]">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="border-t p-4 flex-shrink-0">
      <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2">
        <ComposerPrimitive.Input
          placeholder="Type a message..."
          className="flex-1 bg-transparent outline-none text-gray-900"
        />
        <ComposerPrimitive.Send className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <SendHorizontal className="w-4 h-4" />
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
}
