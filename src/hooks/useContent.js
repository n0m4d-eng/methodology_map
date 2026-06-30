import { useState, useEffect } from 'react'

export function useContent() {
  const [techniqueNodes, setTechniqueNodes] = useState([])
  const [writeups,       setWriteups]       = useState([])

  useEffect(() => {
    Promise.all([
      fetch('/content/nodes-index.json').then(r => r.json()),
      fetch('/content/writeups-index.json').then(r => r.json()),
    ]).then(([nodes, writeups]) => {
      setTechniqueNodes(nodes)
      setWriteups(writeups)
    }).catch(err => {
      console.error('Failed to load content indices:', err)
    })
  }, [])

  return { techniqueNodes, writeups }
}
