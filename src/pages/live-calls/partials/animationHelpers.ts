import React from 'react'

/**
 * Get section key for animation
 */
export const getSectionKey = (section: string): string => {
  switch (section) {
    case 'supervision': return 'supervision'
    case 'onCall': return 'oncall'
    case 'activeIdle': return 'online'
    case 'downOffline': return 'offline'
    default: return 'offline'
  }
}

/**
 * Animate card movement using FLIP animation
 */
export const animateCardMove = (
  dn: string,
  cardPositionsRef: React.MutableRefObject<{ [dn: string]: { x: number; y: number; width: number; height: number } }>,
  setAnimatingCards: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  const first = cardPositionsRef.current[dn]
  if (!first) {
    return
  }
  
  const card = document.querySelector(`[data-dn="${dn}"]`) as HTMLElement
  if (!card) {
    return
  }

  setAnimatingCards(prev => new Set(Array.from(prev).concat(dn)))
  
  const lastRect = card.getBoundingClientRect()
  const last = {
    x: lastRect.left,
    y: lastRect.top,
    width: lastRect.width,
    height: lastRect.height
  }
  
  const dx = first.x - last.x
  const dy = first.y - last.y
  const sx = first.width / last.width
  const sy = first.height / last.height

  if (dx === 0 && dy === 0 && sx === 1 && sy === 1) {
    setAnimatingCards(prev => {
      const newSet = new Set(Array.from(prev))
      newSet.delete(dn)
      return newSet
    })
    return
  }

  card.style.transition = 'none'
  card.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
  card.classList.add('anim-moving')
  card.style.backgroundColor = 'rgba(255, 255, 0, 0.3)'
  card.classList.add('status-glow')
  card.offsetHeight
  
  requestAnimationFrame(() => {
    card.style.transition = 'transform 0.55s cubic-bezier(0.2, 0.9, 0.2, 1)'
    card.style.transform = 'none'
  })

  card.addEventListener('transitionend', () => {
    card.classList.remove('anim-moving')
    card.classList.remove('status-glow')
    card.style.backgroundColor = ''
    card.style.transition = ''
    card.style.transform = ''
    
    setAnimatingCards(prev => {
      const newSet = new Set(Array.from(prev))
      newSet.delete(dn)
      return newSet
    })
  }, { once: true })
}

