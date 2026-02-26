# Animation System

This directory contains a comprehensive animation system for the CTI dashboard application.

## Files

- `animations.scss` - Main animation styles and keyframes
- `cti-live-calls.scss` - Live calls specific styles (imports animations)
- `cti-dashboard.scss` - Dashboard specific styles (imports animations)

## Usage

### CSS Classes

#### FLIP Animation (Card Movement)
```scss
.anim-moving {
  // Smooth card movement between sections
  // Duration: 0.55s
  // Easing: cubic-bezier(0.2, 0.9, 0.2, 1)
}
```

#### Status Effects
```scss
.status-glow {
  // Glow effect when card status changes
  // Duration: 0.6s
}

.return-glow {
  // Glow effect when card returns to remembered position
  // Duration: 2s
}
```

#### Card Flip (3D Effect)
```scss
.user-card.is-flipped .card-inner {
  // 3D flip effect for card details
  // Duration: 0.6s
}
```

#### Pulse Animations
```scss
.ringing-pulse {
  // Pulsing effect for ringing calls
  // Duration: 1s infinite
}
```

### Utility Classes

#### Hover Effects
```scss
.hover-lift:hover     // Lifts element on hover
.hover-scale:hover    // Scales element on hover
.hover-glow:hover     // Adds glow on hover
```

#### Transitions
```scss
.transition-all        // All properties transition
.transition-transform  // Transform only
.transition-opacity    // Opacity only
.transition-colors     // Color properties only
```

#### Animation States
```scss
.animating            // Element is currently animating
.animation-paused     // Pause animation
.animation-running    // Resume animation
```

## CSS Variables

### Easing Functions
```scss
--ease: cubic-bezier(0.2, 0.9, 0.2, 1);        // Default smooth easing
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1); // Smooth in-out
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);    // Smooth out
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);       // Smooth in
```

### Durations
```scss
--duration-fast: 0.2s;    // Quick animations
--duration-normal: 0.3s;  // Standard animations
--duration-slow: 0.55s;   // Slow animations (FLIP)
--duration-slower: 0.8s;  // Very slow animations
```

### Delays
```scss
--delay-short: 0.1s;   // Short delay
--delay-medium: 0.2s;  // Medium delay
--delay-long: 0.3s;    // Long delay
```

## Performance

### Optimized Classes
```scss
.animate-optimized {
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}

.animate-gpu {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}
```

### Accessibility
The system includes `prefers-reduced-motion` support to respect user accessibility preferences.

## Examples

### Basic Card Movement
```javascript
// Add animating class
card.classList.add('anim-moving');

// Remove after animation
card.addEventListener('transitionend', () => {
  card.classList.remove('anim-moving');
});
```

### Status Change with Glow
```javascript
// Add status glow effect
card.classList.add('status-glow');
setTimeout(() => card.classList.remove('status-glow'), 600);
```

### Card Flip Effect
```javascript
// Toggle flip state
card.classList.toggle('is-flipped');
```

## Best Practices

1. **Use CSS classes** instead of inline styles for animations
2. **Clean up classes** after animations complete
3. **Use appropriate durations** based on animation type
4. **Test with reduced motion** enabled
5. **Optimize for performance** with `will-change` and GPU acceleration
6. **Keep animations subtle** and professional

## Browser Support

- Modern browsers with CSS3 support
- Graceful degradation for older browsers
- WebKit prefixes included where needed
