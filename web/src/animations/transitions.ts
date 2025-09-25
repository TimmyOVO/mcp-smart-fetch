export const fadeInUp = {
  initial: {
    opacity: 0,
    y: 60
  },
  animate: {
    opacity: 1,
    y: 0
  }
}

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const scaleIn = {
  initial: {
    opacity: 0,
    scale: 0.8
  },
  animate: {
    opacity: 1,
    scale: 1
  }
}

export const slideInLeft = {
  initial: {
    opacity: 0,
    x: -100
  },
  animate: {
    opacity: 1,
    x: 0
  }
}

export const slideInRight = {
  initial: {
    opacity: 0,
    x: 100
  },
  animate: {
    opacity: 1,
    x: 0
  }
}

export const typewriter = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1
  }
}

export const letter = {
  hidden: {
    opacity: 0,
    y: 50
  },
  visible: {
    opacity: 1,
    y: 0
  }
}

export const floatAnimation = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}