"use client"

export interface RecordingResult {
  blob: Blob
  url: string
  durationMs: number
}

export class ShadowingAudioRecorder {
  private stream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private startTime = 0
  private mimeType: string | null = null

  async requestPermission(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return false
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      return true
    } catch {
      return false
    }
  }

  start(): boolean {
    if (!this.stream) return false

    const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
    this.mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? ""

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.mimeType || undefined,
      })
    } catch {
      try {
        this.mediaRecorder = new MediaRecorder(this.stream)
        this.mimeType = this.mediaRecorder.mimeType
      } catch {
        this.stopStream()
        return false
      }
    }

    this.chunks = []
    this.startTime = Date.now()

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.start(100)
    return true
  }

  stop(): RecordingResult | null {
    const recorder = this.mediaRecorder
    if (!recorder || recorder.state === "inactive") {
      this.stopStream()
      return null
    }

    const durationMs = Date.now() - this.startTime

    return new Promise<RecordingResult | null>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mimeType || "audio/webm",
        })
        this.stopStream()
        if (blob.size === 0) {
          resolve(null)
          return
        }
        resolve({
          blob,
          url: URL.createObjectURL(blob),
          durationMs,
        })
      }
      recorder.stop()
    }) as unknown as RecordingResult | null
  }

  cancel() {
    this.mediaRecorder?.stop()
    this.stopStream()
  }

  private stopStream() {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    this.mediaRecorder = null
  }
}

export function playAudio(url: string): HTMLAudioElement {
  const audio = new Audio(url)
  audio.play().catch(() => undefined)
  return audio
}

export async function playAudioSequence(urls: string[]): Promise<void> {
  if (urls.length === 0) return
  return new Promise((resolve) => {
    let index = 0
    const playNext = () => {
      if (index >= urls.length) {
        resolve()
        return
      }
      const audio = new Audio(urls[index])
      index += 1
      audio.onended = playNext
      audio.onerror = playNext
      audio.play().catch(playNext)
    }
    playNext()
  })
}
