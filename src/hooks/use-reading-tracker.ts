'use client'

import { useEffect, useRef } from 'react'
import { apiClient } from '@/lib/api'
import { SKILL_TYPE_ID } from '@/lib/api/autopilot-client'

const FLUSH_INTERVAL_MS = 5 * 60 * 1000  // flush every 5 minutes
const TICK_INTERVAL_MS  = 60 * 1000       // increment counter every 1 minute

/**
 * Tracks active reading time and reports it to the backend every 5 minutes.
 * Only ticks while the browser tab is visible.
 * Flushes remaining minutes on component unmount or tab hide.
 *
 * @param projectId  Current project ID. Pass null/undefined to disable tracking.
 */
export function useReadingTracker(projectId: string | null | undefined) {
  const accumulatedRef = useRef(0)   // minutes accumulated since last flush
  const projectIdRef   = useRef(projectId)

  // Keep projectIdRef in sync without re-running effects
  useEffect(() => {
    projectIdRef.current = projectId
  }, [projectId])

  useEffect(() => {
    if (!projectId) return

    const isVisible = () => document.visibilityState === 'visible'

    const flush = async () => {
      const minutes = accumulatedRef.current
      const pid = projectIdRef.current
      if (minutes < 1 || !pid) return

      accumulatedRef.current = 0  // reset before the async call to avoid double-count
      try {
        await apiClient.autopilot.trackSkill(pid, SKILL_TYPE_ID.READING, minutes)
      } catch {
        // Non-critical: silently fail, minutes are lost but that's acceptable
      }
    }

    // Increment once per minute while visible
    const tickInterval = setInterval(() => {
      if (isVisible()) {
        accumulatedRef.current += 1
      }
    }, TICK_INTERVAL_MS)

    // Flush to server every 5 minutes
    const flushInterval = setInterval(flush, FLUSH_INTERVAL_MS)

    // Flush when user hides/leaves the tab
    const handleVisibilityChange = () => {
      if (!isVisible()) {
        flush()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(tickInterval)
      clearInterval(flushInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // Final flush on unmount
      flush()
    }
  }, [projectId])
}
