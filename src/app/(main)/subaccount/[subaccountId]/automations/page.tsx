"use client";

import React, { useState } from "react";
import BlurPage from "../../../../../components/global/blur-page";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useUser } from "@clerk/clerk-react";

const genAI = new GoogleGenerativeAI("AIzaSyBtPGgfBv1fgQFU67Wq6uXHpPspvgpQEm8");

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
          isMarkdown: isMarkdownResponse, // Indicates markdown content
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
            code({ node, inline, className, children, ...props }: { node?: any, inline?: boolean, className?: string, children?: React.ReactNode }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <div style={{ position: "relative" }}>
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
                  <CopyToClipboard text={String(children).replace(/\n$/, "")}>
                    <button
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        padding: "6px 12px",
                        backgroundColor: "#007BFF",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Copy Code
                    </button>
                  </CopyToClipboard>
                </div>
              ) : (
                <code
                  {...props}
                  style={{
                    backgroundColor: "gray",
                    padding: "2px 4px",
                    borderRadius: "4px",
                  }}
                >
                  {children}
                </code>
              );
            },
            p({ children }) {
              return (
                <p
                  style={{
                    marginBottom: "10px",
                    fontSize: "16px",
                    lineHeight: "1.6",
                  }}
                >
                  {children}
                </p>
              );
            },
            ul({ children }) {
              return (
                <ul
                  style={{
                    marginLeft: "20px",
                    listStyleType: "circle",
                    marginBottom: "10px",
                  }}
                >
                  {children}
                </ul>
              );
            },
            li({ children }) {
              return (
                <li
                  style={{
                    marginBottom: "8px",
                    fontSize: "16px",
                  }}
                >
                  {children}
                </li>
              );
            },
            strong({ children }) {
              return (
                <strong
                  style={{
                    fontWeight: "bold",
                    color: "#007BFF", // You can adjust the color for bold text
                  }}
                >
                  {children}
                </strong>
              );
            },
            em({ children }) {
              return (
                <em
                  style={{
                    fontStyle: "italic",
                    color: "#FF6347", // You can adjust the color for italic text
                  }}
                >
                  {children}
                </em>
              );
            },
            br() {
              return <br />; // Line breaks
            },
          }}
        >
          {message.text}
        </ReactMarkdown>
      );
    }

    return (
      <div style={{ padding: "12px 20px", fontSize: "16px", lineHeight: "1.6" }}>
        <ReactMarkdown>
          {message.text}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <BlurPage>
      <div style={{ padding: "20px", display: "flex", height: "100vh" }}>
        {/* Left Section: Search Bar */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
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
              style={{
                padding: "12px",
                width: "80%",
                marginRight: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "16px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: "12px 24px",
                backgroundColor: "#007BFF",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              {loading ? "Searching" : "Search"}
            </button>
          </div>
          {/* Chat Messages */}
          <div
            style={{
              flex: 1,
              marginTop: "20px",
              overflowY: "auto",
              paddingLeft: "0px",
              marginRight: "60px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE and Edge
            }}
          >
            <style>
              {`
                div::-webkit-scrollbar {
                  display: none; /* Chrome, Safari, Opera */
                }
              `}
            </style>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    message.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: "15px",
                }}
              >
                <img
                  src={
                    message.sender === "user"
                      ? user?.imageUrl || "/user-icon.png"
                      : "/icons/gemini-icon.png"
                  }
                  alt={message.sender}
                  // style={{
                  //   marginRight: "10px",
                  //   width: "30px",
                  //   height: "30px",
                  // }}
                  style={{
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    marginRight: "10px",
                  }}
                />
                <div
                  style={{
                    backgroundColor:
                      message.sender === "user" ? "#007BFF" : "#2c2c2c", // Gemini AI's response in dark gray
                    color: message.sender === "user" ? "white" : "white",
                    padding: "5px",
                    borderRadius: "15px",
                    maxWidth: "70%",
                    wordWrap: "break-word",
                    fontSize: "14px",
                  }}
                >
                  {renderMessage(message)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: History and Clear Chat */}
        <div
          style={{
            flex: 1,
            borderLeft: "1px solid #ccc",
            paddingLeft: "20px",
          }}
        >
          <h3 className="text-lg font-semibold mb-4">Search History</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {searchHistory.map((term, index) => (
              <li
                key={index}
                style={{
                  display: "block", // Changed from inline-block to block
                  padding: "12px", // Add padding for spacing inside the box
                  marginBottom: "10px", // Add margin between items
                  borderRadius: "8px", // Rounded corners
                  backgroundColor: "rgba(169, 169, 169, 0.2)",
                  cursor: "pointer",
                  color: "white",
                  textDecoration: "none",
                  fontSize: "14px", // Adjust font size if needed
                }}
                onClick={() => handleHistoryClick(term)}
              >
                {term}
              </li>
            ))}
          </ul>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <button
              onClick={clearChat}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "red",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>
    </BlurPage>
  );
};

export default Automations;
