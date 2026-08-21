"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { ArrowUp, Loader2, Plus, Mic, MicOff } from "lucide-react"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"

interface AgentComposerProps {
  disabled?: boolean
  placeholder?: string
  onSend: (text: string) => void | Promise<void>
}

export function AgentComposer({ disabled = false, placeholder, onSend }: AgentComposerProps) {
  const [value, setValue] = useState("")
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  
  // Store the base value before the current speech segment starts
  const baseValueRef = useRef("")

  const handleSpeechResult = useCallback((text: string, isFinal: boolean) => {
    // Append the new text to the value we had before recording started
    const separator = baseValueRef.current && text ? " " : ""
    const newValue = baseValueRef.current + separator + text
    setValue(newValue)
    
    // If the browser finalized this chunk, update our base value
    if (isFinal) {
      baseValueRef.current = newValue
    }

    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto'
      textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 200)}px`
    }
  }, [])

  const { isRecording, isSupported, toggleRecording } = useSpeechRecognition({
    onResult: handleSpeechResult,
    lang: "en-US", // Defaulting to English, can be made dynamic later
  })

  // Keep baseValueRef synced when user types manually
  useEffect(() => {
    if (!isRecording) {
      baseValueRef.current = value
    }
  }, [value, isRecording])

  const submit = async () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    
    if (isRecording) {
      toggleRecording() // stop recording on send
    }
    
    setValue("")
    baseValueRef.current = ""
    
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto'
    }
    
    await onSend(trimmed)
  }

  return (
    <div className="w-full">
      <div className={`flex items-end gap-2 rounded-xl border bg-[#1E1E1E] p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-colors ${
        isRecording ? "border-brand-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]" : "border-white/10"
      }`}>
        <button
          type="button"
          disabled={disabled}
          className="h-[40px] w-[40px] rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 flex items-center justify-center transition shrink-0 mb-[2px] ml-[2px]"
          title="Add context"
        >
          <Plus className="h-5 w-5" />
        </button>
        <textarea
          ref={textAreaRef}
          value={value}
          onChange={(e) => {
             setValue(e.target.value)
             e.target.style.height = 'auto'
             e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void submit()
            }
          }}
          rows={1}
          placeholder={isRecording ? "Listening..." : (placeholder ?? "Ask Study Copilot...")}
          disabled={disabled && !isRecording}
          className="flex-1 resize-none bg-transparent px-2 py-3 text-sm md:text-base text-white placeholder:text-gray-500 focus:outline-none disabled:opacity-60 min-h-[44px] max-h-[200px] overflow-y-auto custom-scroll"
        />
        <div className="flex items-center gap-1 mb-[2px] mr-[2px] shrink-0">
          {isSupported && (
            <button
              type="button"
              disabled={disabled && !isRecording}
              onClick={toggleRecording}
              className={`h-[40px] w-[40px] rounded-lg flex items-center justify-center transition ${
                isRecording 
                  ? "bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30" 
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
              title={isRecording ? "Stop recording" : "Voice input"}
            >
              {isRecording ? (
                <div className="relative flex items-center justify-center">
                  <Mic className="h-[18px] w-[18px] z-10" />
                  <span className="absolute h-full w-full rounded-full bg-brand-primary/40 animate-ping" />
                </div>
              ) : (
                <Mic className="h-[18px] w-[18px]" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            className="h-[40px] w-[40px] rounded-lg bg-white/5 text-gray-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          >
            {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
