import { useState, useCallback } from 'react'

interface LoadingState {
  isLoading: boolean
  progress: number
  message: string
}

export const useLoadingState = (minLoadingTime: number = 2000) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    message: '正在初始化...'
  })

  const startLoading = useCallback(() => {
    setState({
      isLoading: true,
      progress: 0,
      message: '正在初始化...'
    })
  }, [])

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || prev.message
    }))
  }, [])

  const completeLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      progress: 100,
      message: '加载完成！'
    }))

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isLoading: false
      }))
    }, 500)
  }, [])

  const simulateLoading = useCallback(() => {
    startLoading()

    const messages = [
      '正在初始化...',
      '正在加载资源...',
      '正在配置环境...',
      '正在连接服务...',
      '正在准备界面...',
      '即将完成...'
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      const progress = Math.min(100, (currentStep / messages.length) * 100)
      const message = messages[Math.min(currentStep - 1, messages.length - 1)]

      updateProgress(progress, message)

      if (currentStep >= messages.length) {
        clearInterval(interval)
        completeLoading()
      }
    }, minLoadingTime / messages.length)

    return () => clearInterval(interval)
  }, [startLoading, updateProgress, completeLoading, minLoadingTime])

  return {
    ...state,
    startLoading,
    updateProgress,
    completeLoading,
    simulateLoading
  }
}