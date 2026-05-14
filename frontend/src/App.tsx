import React from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import FormPanel from "./components/FormPanel";
import ChatPanel from "./components/ChatPanel";

function App() {
  return (
    <Provider store={store}>
      <div className="h-screen flex flex-col font-sans">
        {/* Top bar */}
        <header className="h-14 bg-blue-700 flex items-center px-6 shadow-md flex-shrink-0">
          <span className="text-white font-semibold text-base tracking-wide">
            HCP Interaction Logger
          </span>
          <span className="ml-3 text-blue-200 text-xs font-medium uppercase tracking-widest">
            AI-Powered CRM
          </span>
        </header>

        {/* Split screen */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — Form */}
          <div className="w-1/2 overflow-hidden border-r border-gray-200">
            <FormPanel />
          </div>

          {/* Right — Chat */}
          <div className="w-1/2 overflow-hidden">
            <ChatPanel />
          </div>
        </div>
      </div>
    </Provider>
  );
}

export default App;
