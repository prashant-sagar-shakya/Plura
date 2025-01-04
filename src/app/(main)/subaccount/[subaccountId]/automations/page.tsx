"use client";
import React, { useState, useRef, useEffect } from "react";
import BlurPage from "../../../../../components/global/blur-page";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useUser } from "@clerk/clerk-react";
import { FaHistory } from "react-icons/fa"; // Import history icon

const genAI = new GoogleGenerativeAI(
  `${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`
);

type Props = {
  params: { subaccountId: string };
};

const Automations = ({ params }: Props) => {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [messages, setMessages] = useState<
    {
      sender: "user" | "gemini";
      text: string;
      isMarkdown?: boolean;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to toggle sidebar
  const sidebarRef = useRef<HTMLDivElement | null>(null); // Reference for sidebar

  // Close sidebar if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    // Add event listener for detecting outside clicks
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError("");

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "user", text: searchTerm },
      ]);

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(searchTerm);

      const isMarkdownResponse = result.response.text().includes("```");

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "gemini",
          text: result.response.text(),
          isMarkdown: isMarkdownResponse,
        },
      ]);

      setSearchHistory((prev) => [
        searchTerm,
        ...prev.filter((term) => term !== searchTerm),
      ]);
      setSearchTerm("");
    } catch (err: any) {
      setError(
        err.message || "An error occurred while interacting with Gemini."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (term: string) => {
    setSearchTerm(term);
    handleSearch();
  };

  const clearChat = () => {
    setMessages([]);
    setSearchHistory([]);
  };

  const renderMessage = (message: {
    sender: string;
    text: string;
    isMarkdown?: boolean;
  }) => {
    if (message.isMarkdown) {
      return (
        <ReactMarkdown
          components={{
            code({
              node,
              inline,
              className,
              children,
              ...props
            }: {
              node?: any;
              inline?: boolean;
              className?: string;
              children?: React.ReactNode;
            }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <div className="relative">
                  <SyntaxHighlighter
                    style={dark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      padding: "15px",
                      borderRadius: "8px",
                      backgroundColor: "#2d2d2d",
                      marginBottom: "15px",
                    }}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                  <CopyToClipboard
                    text={String(children).replace(/\n$/, "")}
                    onCopy={() => setCopied(true)}
                  >
                    <button className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
                      {copied ? "Copied!" : "Copy Code"}
                    </button>
                  </CopyToClipboard>
                </div>
              ) : (
                <code {...props} className="bg-gray-300 px-1 py-0.5 rounded-sm">
                  {children}
                </code>
              );
            },
            p({ children }) {
              return (
                <p className="mb-2 text-base leading-relaxed">{children}</p>
              );
            },
            ul({ children }) {
              return <ul className="ml-5 list-disc mb-2">{children}</ul>;
            },
            li({ children }) {
              return <li className="mb-2 text-base">{children}</li>;
            },
            strong({ children }) {
              return (
                <strong className="font-bold text-blue-600">{children}</strong>
              );
            },
            em({ children }) {
              return <em className="italic text-red-500">{children}</em>;
            },
            br() {
              return <br />;
            },
          }}
        >
          {message.text}
        </ReactMarkdown>
      );
    }

    return (
      <div className="px-5 text-base leading-relaxed">
        <ReactMarkdown>{message.text}</ReactMarkdown>
      </div>
    );
  };

  return (
    <BlurPage>
      <div className="p-10 flex h-screen flex-col md:flex-row">
        {/* Left Section: Chat Messages */}
        <div className="flex-[3] flex flex-col">
          <div className="flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Ask with AI"
              className="p-3 w-full sm:w-4/5 mr-2 rounded-full text-base shadow-md"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-700 text-white rounded-full text-base"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 mt-5 overflow-y-auto ml-[-1.2rem] lg:ml-0 px-0 lg:mr-14 shadow-md">
            <style>
              {`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-center justify-${
                  message.sender === "user" ? "end" : "start"
                } mb-4`}
              >
                <img
                  src={
                    message.sender === "user"
                      ? user?.imageUrl || "/user-icon.png"
                      : "/icons/gemini-icon.png"
                  }
                  alt={message.sender}
                  className="rounded-full w-8 h-8 sm:w-10 sm:h-10 ml-2 p-1"
                />
                <div
                  className={`bg-${
                    message.sender === "user" ? "blue-700" : "gray-800"
                  }
                    text-white p-3 sm:p-4 rounded-xl max-w-full sm:max-w-3/4 break-words text-sm`}
                >
                  {renderMessage(message)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Search History */}
        <div className="flex-1 border-l border-gray-300 pl-5 hidden md:flex flex-col">
          <h3 className="p-3 w-full sm:w-4/5 mr-2 text-lg font-semibold mb-4 md:mt-0 mt-4">
            Search History
          </h3>
          <ul className="list-none p-0">
            {searchHistory.map((term, index) => (
              <li
                key={index}
                className="block p-3 mb-2 rounded-md bg-gray-900 cursor-pointer text-white text-sm"
                onClick={() => handleHistoryClick(term)}
              >
                {term}
              </li>
            ))}
          </ul>
          <div className="flex justify-center mt-5">
            <button
              onClick={clearChat}
              className="mt-5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Sidebar for Small Devices */}
        {isSidebarOpen && (
          <div
            ref={sidebarRef} // Attach the ref to sidebar div
            className={`fixed top-0 right-0 w-2/3 h-full bg-gray-800 text-white flex flex-col p-5 z-50 md:hidden transform transition-transform ease-in-out duration-500 ${
              isSidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <button
              className="self-end mb-5 text-red-600"
              onClick={() => setIsSidebarOpen(false)}
            >
              Close
            </button>
            <h3 className="text-lg font-semibold mb-4 mt-10">Search History</h3>
            <ul className="list-none p-0">
              {searchHistory.map((term, index) => (
                <li
                  key={index}
                  className="block p-3 mb-2 rounded-md bg-gray-900 cursor-pointer text-white text-sm backdrop-filter backdrop-blur-lg bg-opacity-50"
                  onClick={() => handleHistoryClick(term)}
                >
                  {term}
                </li>
              ))}
            </ul>
            <div className="flex justify-center mt-5">
              <button
                onClick={clearChat}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
              >
                Clear Chat
              </button>
            </div>
          </div>
        )}
        {/* History Icon Button */}
        <button
          className="fixed bottom-5 right-5 md:hidden bg-blue-700 text-white p-3 rounded-full shadow-lg"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <FaHistory size={20} />
        </button>
      </div>
    </BlurPage>
  );
};

export default Automations;
