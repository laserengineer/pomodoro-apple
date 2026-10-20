import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

// 布尔设置:读取 localStorage 作初始值,变化时自动写回
export function usePersistentBool(key: string): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [value, setValue] = useState(() => localStorage.getItem(key) === '1')
  useEffect(() => {
    localStorage.setItem(key, value ? '1' : '0')
  }, [key, value])
  return [value, setValue]
}
