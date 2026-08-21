import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DeleteBookDialog } from "./delete-book-dialog"
import type { ReaderLibraryBook } from "@/app/reader/library-storage"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: { title?: string }) => {
    if (key === "deleteBookTitle") return "Delete book from library?"
    if (key === "deleteBookDesc") return `Are you sure you want to delete "${params?.title}"?`
    if (key === "cancel") return "Cancel"
    if (key === "delete") return "Delete"
    if (key === "deleting") return "Deleting..."
    return key
  },
}))

const mockBook: ReaderLibraryBook = {
  id: "book-1",
  title: "Test Book Title",
  fileName: "test.pdf",
  url: "/test.pdf",
  documentId: "doc-1",
  pageCount: 10,
  uploadedAt: new Date().toISOString(),
  lastOpenedAt: new Date().toISOString(),
}

describe("DeleteBookDialog", () => {
  it("renders modal content when open", () => {
    render(
      <DeleteBookDialog
        book={mockBook}
        isOpen={true}
        isDeleting={false}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    )

    expect(screen.getByText("Delete book from library?")).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete "Test Book Title"?')).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()
  })

  it("calls onConfirm when delete button clicked", () => {
    const handleConfirm = vi.fn()
    render(
      <DeleteBookDialog
        book={mockBook}
        isOpen={true}
        isDeleting={false}
        onClose={() => {}}
        onConfirm={handleConfirm}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(handleConfirm).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when cancel button clicked", () => {
    const handleClose = vi.fn()
    render(
      <DeleteBookDialog
        book={mockBook}
        isOpen={true}
        isDeleting={false}
        onClose={handleClose}
        onConfirm={() => {}}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
