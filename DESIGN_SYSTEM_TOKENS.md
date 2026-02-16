# Design System Reference Guide

## 🎨 Premium Glassmorphic Chat App Design Tokens

This guide provides all the design tokens, color values, and utility classes used throughout the chat application.

---

## 🌈 Color Palette

### Background Colors
```
Primary BG Gradient:        from-slate-950 via-slate-900 to-slate-950
Surface Glass (default):    bg-slate-800/40
Surface Glass (hover):      hover:bg-slate-800/60
Semi-transparent glass:     bg-white/5
Glass (hover):              hover:bg-white/10
```

### Text Colors
```
Primary text:               text-slate-50
Secondary text:             text-slate-300
Muted text:                 text-slate-500 / text-slate-400
Disabled text:              text-slate-700
```

### Accent Colors
```
Cyan/Blue (primary):        from-cyan-500 to-blue-500
Cyan/Blue (light):          from-cyan-400 to-blue-400
Emerald/Green (success):    from-emerald-500 to-green-500
Red (danger):               from-red-500 to-red-600
Orange (warning):           from-orange-400 to-orange-600
Purple/Pink (secondary):    from-purple-500 to-pink-500
```

### Border Colors
```
Default border:             border-white/10
Hover border:               border-white/20
Accent border:              border-cyan-400/50 / border-cyan-400/30
Error border:               border-red-400/50 / border-red-400/30
Success border:             border-emerald-400/30
```

### Status Indicators
```
Online:                     bg-emerald-400
Offline:                    bg-slate-600
Calling:                    bg-orange-400
```

---

## 📐 Spacing System

```
xs (extra small):           p-1      (4px)
sm (small):                 p-2      (8px)
md (medium):                p-4      (16px)
lg (large):                 p-6      (24px)
xl (extra large):           p-8      (32px)
```

---

## 🔲 Border Radius

```
Small:                      rounded-lg       (8px)
Medium:                     rounded-xl       (12px)
Large:                      rounded-2xl      (16px)
Extra Large:                rounded-3xl      (24px)
Full (circle):              rounded-full
```

---

## ✨ Shadows & Effects

### Backdrop Blur
```
Standard blur:              backdrop-blur-xl         (24px)
Extra blur:                 backdrop-blur-2xl        (40px)
```

### Drop Shadows
```
Small shadow:               shadow-sm shadow-black/10
Standard shadow:            shadow-lg shadow-black/40
Large shadow:               shadow-xl shadow-black/50
Extra large shadow:         shadow-2xl shadow-black/50
```

### Accent Shadows
```
Cyan accent:                shadow-cyan-500/30 or shadow-cyan-500/50
Blue accent:                shadow-blue-500/30
Red accent:                 shadow-red-500/30
Green accent:               shadow-emerald-500/30
Purple accent:              shadow-purple-500/30
```

---

## 🎬 Animations

### Keyframe Animations
```
slideUp:                    translateY(10px → 0) + opacity fade
slideIn:                    translateX(20px → 0) + opacity fade
fadeIn:                     opacity(0 → 1)
scaleIn:                    scale(0.95 → 1) + opacity fade
pulse-slow:                 scale with 3s duration
```

### Animation Utility Classes
```
animate-slide-up            Messages, cards entering
animate-slide-in            Sidebar items, modal overlays
animate-scale-in            Modal dialogs, forms
animate-fade-in             Background elements, overlays
animate-pulse-slow          Online status, background elements
animation-delay-500         0.5s delay on second element
animation-delay-1000        1s delay on third element
```

### Transition Utilities
```
Standard transition:        transition-all duration-300
Smooth on hover:            hover:scale-105
Active press state:         active:scale-95
```

---

## 🔤 Typography System

### Font Families
```
Display (headings):         Space Grotesk (400, 500, 600, 700)
Body text:                  Inter (400, 500, 600)
```

### Font Sizes & Weights
```
h1 / Title:                 text-4xl font-bold font-display tracking-tight
h2 / Subtitle:              text-3xl font-semibold font-display
h3 / Section:               text-2xl font-bold font-display
h4 / Card Title:            text-xl font-semibold font-display
Body (default):             text-base font-body
Body (small):               text-sm font-body
Caption:                    text-xs font-medium font-body tracking-wide
```

---

## 🧩 Reusable Component Patterns

### Card/Surface Pattern
```jsx
<div className="
  backdrop-blur-xl 
  bg-white/5 
  border border-white/10 
  rounded-2xl 
  p-6 
  shadow-lg shadow-black/20
  transition-all duration-300
  hover:bg-white/10 
  hover:shadow-xl
">
```

### Button Pattern (Primary)
```jsx
<button className="
  px-6 py-3 
  bg-gradient-to-r from-cyan-500 to-blue-500 
  hover:from-cyan-400 hover:to-blue-400 
  text-white font-semibold 
  rounded-xl 
  shadow-lg shadow-cyan-500/30 
  transition-all duration-300 
  hover:scale-105 
  active:scale-95
">
```

### Button Pattern (Secondary)
```jsx
<button className="
  px-6 py-3 
  backdrop-blur-lg 
  bg-white/5 
  hover:bg-white/10 
  border border-white/10 
  text-slate-300 
  font-semibold 
  rounded-xl 
  transition-all duration-300 
  hover:scale-105
">
```

### Input Pattern
```jsx
<input className="
  w-full 
  px-4 py-3 
  backdrop-blur-xl 
  bg-white/5 
  border border-white/10 
  focus:border-cyan-400/50 
  focus:bg-white/10 
  rounded-xl 
  text-slate-100 
  placeholder:text-slate-500 
  outline-none 
  transition-all duration-300 
  focus:shadow-lg focus:shadow-cyan-500/10
">
```

### Avatar Pattern
```jsx
<div className="
  w-12 h-12 
  rounded-full 
  bg-gradient-to-br from-cyan-400 to-blue-600 
  flex items-center justify-center 
  text-white font-bold 
  shadow-lg shadow-cyan-500/30 
  transition-all duration-300 
  group-hover:scale-110 
  group-hover:shadow-xl
">
```

### Message Bubble Pattern (Sent)
```jsx
<div className="
  max-w-xs 
  px-4 py-3 
  backdrop-blur-xl 
  bg-gradient-to-br from-cyan-500/20 to-blue-500/20 
  border border-cyan-400/30 
  rounded-2xl rounded-br-md 
  shadow-lg shadow-cyan-500/10 
  hover:shadow-cyan-500/20
">
```

### Message Bubble Pattern (Received)
```jsx
<div className="
  max-w-xs 
  px-4 py-3 
  backdrop-blur-xl 
  bg-white/5 
  border border-white/10 
  rounded-2xl rounded-bl-md 
  shadow-lg shadow-black/20 
  hover:bg-white/10
">
```

---

## 📱 Responsive Breakpoints

### Mobile First Approach
```
Default (mobile < 768px):   All styles apply
Tablet (md: ≥ 768px):       md:w-80, md:p-6
Desktop (lg: ≥ 1024px):     lg:w-96, lg:p-8

Hide on mobile:             hidden lg:block
Show on mobile:             block lg:hidden
```

---

## 🎯 Component Styling Reference

### Messages
- **Sent**: Cyan gradient with right alignment, rounded-br-md corner
- **Received**: White glass with left alignment, rounded-bl-md corner
- **Status**: Small timestamp with icon (✓, ✓✓)

### Buttons
- **Primary**: Gradient cyan-to-blue with scale-105 hover
- **Secondary**: Glass effect with opacity hover
- **Danger**: Gradient red with scale-105 hover
- **Success**: Gradient green-to-emerald

### Forms
- **Input**: Glass with white/5 background, cyan focus
- **Label**: text-slate-300 at sm size
- **Error**: Red text (text-red-400) with red/20 background border

### Cards
- **Info Card**: Glass surface with heading and subtext
- **Friend Item**: Glass with avatar, username, unread badge
- **Request Card**: Glass with accept/reject buttons

### Modals
- **Backdrop**: backdrop-blur-md bg-black/60
- **Content**: Glass surface with rounded-3xl border
- **Close Button**: Glass icon button with rotate-90 on hover

### Status Indicators
- **Online**: Emerald-400 with animate-pulse-slow
- **Offline**: Slate-600 static
- **Calling**: Orange-400 animated

---

## 🔧 Advanced Customization

### Adjust Gradient
```
Change from-cyan-500 to from-blue-500
Change to-blue-500 to to-purple-500
```

### Adjust Blur Amount
```
backdrop-blur-xl   → backdrop-blur-lg (more transparent)
backdrop-blur-2xl  → backdrop-blur-xl (less blur)
```

### Adjust Shadows
```
shadow-black/20   → shadow-black/10 (lighter)
shadow-black/40   → shadow-black/60 (darker)
```

### Adjust Opacity
```
bg-white/5   → bg-white/10 (more opaque)
bg-white/10  → bg-white/3 (more transparent)
```

---

## 💡 Best Practices

1. **Use Design Tokens**: Always reference this guide instead of hardcoding colors
2. **Maintain Consistency**: Keep shadows, blur, and spacing consistent
3. **Animate Interactions**: Add hover/active states to all interactive elements
4. **Responsive First**: Design mobile-first, then enhance for larger screens
5. **Performance**: Use Tailwind utilities, avoid custom CSS when possible
6. **Accessibility**: Maintain sufficient color contrast ratios
7. **Typography**: Use Space Grotesk for headings, Inter for body
8. **Spacing**: Use the spacing scale (xs, sm, md, lg, xl)

---

## 📋 Tailwind Configuration Reference

See `tailwind.config.js` for:
- Extended color definitions
- Custom keyframe animations
- Animation timings
- Backdrop blur values
- Custom transition properties

---

**Last Updated**: January 27, 2026
**Version**: 1.0
**Status**: Production Ready ✅
