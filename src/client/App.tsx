import { useAsync } from "./hooks/useAsync";
import { fetchChatHistory } from "./utils";
import { Chat } from "./Chat";

export function App() {
  const { loading, error, value: initialMessages } = useAsync(fetchChatHistory);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-red-500">Failed to load conversation</p>
      </div>
    );
  }

  // Only render Chat (which calls useLocalRuntime) after data is loaded
  return <Chat initialMessages={initialMessages ?? []} />;
}
