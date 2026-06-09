"use client";

export default function PrintButton() {
  return (
    <button className="pbtn no-print" onClick={() => window.print()}>
      ⌘P · save as PDF
    </button>
  );
}
