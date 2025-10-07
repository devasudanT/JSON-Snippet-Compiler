# JSON Snippet Compiler

A user-friendly web application for building structured JSON content using a modular, snippet-based approach. This tool is perfect for content creators, developers, and anyone who needs to generate well-formed JSON data without writing it by hand.

## ✨ Features

-   **Modular Snippet System:** Construct your JSON by adding and arranging different types of content snippets:
    -   **Meta:** Add core metadata like title, language, date, and relevant URLs.
    -   **Verse:** Include scriptural or referenced text with a source.
    -   **Paragraph:** A flexible text block with basic formatting controls (bold, italic, lists).
    -   **Prayer:** A dedicated snippet for prayers with a title and text.
    -   **Lesson:** A snippet for educational or instructional content.
-   **Intuitive Drag-and-Drop:** Easily reorder snippets by clicking the drag handle and moving them into the desired position.
-   **Live JSON Preview:** See the generated JSON output in real-time as you add, edit, and rearrange snippets. The preview includes syntax highlighting for better readability.
-   **Download Your Content:** Export your final structured content as a `.json` file with a single click.
-   **Modern & Clean UI:** A polished and responsive interface built with React and styled with Tailwind CSS, inspired by the aesthetics of shadcn/ui.
-   **Built with Modern Tech:** A performant and maintainable frontend stack including React, TypeScript, and Tailwind CSS.

## 🚀 How to Use

1.  **Add a Snippet:** Start by adding a `Meta Data` snippet (only one is allowed). Then, use the "Add New Snippet" card to add other content types like `Verse`, `Paragraph`, etc.
2.  **Fill in the Data:** Enter your content into the fields provided for each snippet.
3.  **Reorder as Needed:** Click and drag the grip handle on the left side of any snippet card to change its order. A visual indicator will show where the snippet will be placed.
4.  **Preview the JSON:** Observe the live-updating JSON output on the right-hand side of the screen.
5.  **Download:** Once you are satisfied with your content, click the "Download JSON" button to save your work.

## 💻 Tech Stack

-   **Framework:** React
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** Custom reusable components inspired by shadcn/ui
-   **Utilities:** `clsx`, `tailwind-merge` for class name management
