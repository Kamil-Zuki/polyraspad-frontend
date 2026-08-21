"use client"

import { useEffect } from "react"

export function FontAwesomeLoader() {
  useEffect(() => {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    link.integrity = "sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWYOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
    link.crossOrigin = "anonymous"
    link.referrerPolicy = "no-referrer"
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  return null
}
