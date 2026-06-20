import type OpenAI from "openai";

/**
 * Full set of LifeOS tools available to the AI agent.
 * Every tool maps to a real server-side action in executor.ts.
 */
export const LIFEOS_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  /* ── Journal ── */
  {
    type: "function",
    function: {
      name: "save_journal_entry",
      description:
        "Save the current thought or conversation as a journal entry. Use when Chris says 'save this', 'keep this', 'journal this', or when the conversation is substantial enough to preserve.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title, max 8 words" },
          content: {
            type: "string",
            description: "Journal entry written in Chris's voice, 2-6 sentences",
          },
          capture_type: {
            type: "string",
            enum: [
              "journal",
              "reflection",
              "decision",
              "idea",
              "lesson",
              "note",
              "prayer",
              "book_note",
              "goal_update",
              "other",
            ],
            description: "Type of entry",
          },
          life_area: {
            type: "string",
            enum: [
              "Finance",
              "Health",
              "Career",
              "Learning",
              "Spiritual",
              "Relationships",
              "General",
            ],
            description: "Which life domain this relates to",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "2-4 lowercase tags",
          },
        },
        required: ["title", "content", "capture_type", "life_area"],
      },
    },
  },

  /* ── Navigation ── */
  {
    type: "function",
    function: {
      name: "navigate_to",
      description:
        "Navigate Chris to a different section of the app. Use when he says 'take me to', 'open', 'go to', or 'show me' a section.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            enum: [
              "/today",
              "/capture",
              "/spaces",
              "/entries",
              "/principles",
              "/finance",
            ],
            description: "App path to navigate to",
          },
        },
        required: ["path"],
      },
    },
  },

  /* ── Journal search ── */
  {
    type: "function",
    function: {
      name: "search_journal",
      description:
        "Search Chris's past journal entries to answer questions about his past thoughts, decisions, or reflections.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What to search for" },
          life_area: {
            type: "string",
            enum: [
              "Finance",
              "Health",
              "Career",
              "Learning",
              "Spiritual",
              "Relationships",
              "General",
            ],
            description: "Optional: filter by life area",
          },
          capture_type: {
            type: "string",
            description: "Optional: filter by entry type",
          },
          limit: {
            type: "number",
            description: "Max results to return (default 5)",
          },
        },
        required: ["query"],
      },
    },
  },

  /* ── Finance: read ── */
  {
    type: "function",
    function: {
      name: "get_finance_summary",
      description:
        "Get Chris's current financial state: bank balance, loan balance, net worth, savings, and recent transactions. Use when he asks about money or financial situation.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },

  /* ── Finance: log ── */
  {
    type: "function",
    function: {
      name: "log_finance_entry",
      description:
        "Record a financial transaction. Use when Chris mentions spending, receiving, or saving money. Amounts are in GHS (Ghana cedis).",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "What the transaction was for",
          },
          amount: {
            type: "number",
            description: "Amount in GHS (Ghana cedis), always positive",
          },
          type: {
            type: "string",
            enum: ["Income", "Expense", "Savings"],
            description: "Transaction type",
          },
          category: {
            type: "string",
            enum: [
              "Salary",
              "Other Income",
              "Family Support",
              "Tithe",
              "Personal Spending",
              "Transport",
              "Food",
              "Health",
              "Gifts",
              "Loan Payment",
              "Savings Transfer",
              "Other",
            ],
            description: "Transaction category",
          },
          intent: {
            type: "string",
            enum: ["Necessary", "Optional", "Wasteful", "Investment", "Giving"],
            description: "Spending intent",
          },
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format (default: today)",
          },
        },
        required: ["description", "amount", "type", "category"],
      },
    },
  },

  /* ── Finance: delete ── */
  {
    type: "function",
    function: {
      name: "delete_finance_entry",
      description:
        "Delete a finance transaction by its ID. Use when Chris says 'delete that', 'remove that transaction', etc. First call get_finance_summary to find the ID if needed.",
      parameters: {
        type: "object",
        properties: {
          entry_id: {
            type: "number",
            description: "The numeric ID of the entry to delete",
          },
        },
        required: ["entry_id"],
      },
    },
  },

  /* ── Principles ── */
  {
    type: "function",
    function: {
      name: "get_principles",
      description:
        "Fetch Chris's current personal principles/constitution. Use when he asks about his principles or wants to update them.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_principles",
      description:
        "Update Chris's personal principles/constitution. Use when he says 'add to my principles', 'update my principles', or wants to record a core belief.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The full updated principles text",
          },
        },
        required: ["content"],
      },
    },
  },

  /* ── Entries: delete ── */
  {
    type: "function",
    function: {
      name: "delete_journal_entry",
      description: "Delete a journal entry by ID.",
      parameters: {
        type: "object",
        properties: {
          entry_id: {
            type: "string",
            description: "UUID of the entry to delete",
          },
        },
        required: ["entry_id"],
      },
    },
  },
];
