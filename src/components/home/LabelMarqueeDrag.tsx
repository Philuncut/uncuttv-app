'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Macht die Logoleiste mit dem Finger verschiebbar.
 *
 * Bewusst nur die Huelle: die Durchlaeufe kommen als children aus der
 * Serverkomponente und bleiben dort gerendert. Die Logoliste, die Bilder und
 * die Uebersetzung gehen also nicht mit ins Bundle, ausgeliefert wird nur
 * dieser Code.
 *
 * === Der Kern ===
 * Gezogen wird nicht am Element, sondern an der Uhr der CSS-Animation. Ueber
 * getAnimations() laesst sich ihre currentTime setzen, das Band wird also in
 * seiner eigenen Zeit vor- und zurueckgespult. Zwei Dinge fallen damit von
 * selbst an:
 *
 * - Die Naht haelt in beide Richtungen. Die Animation ist periodisch, die Zeit
 *   wird modulo ihrer Dauer gerechnet -- die Verschiebung bleibt damit
 *   zwangslaeufig zwischen 0 und -50 %, egal wie oft jemand in dieselbe
 *   Richtung wischt. Ein dritter Durchlauf im Markup ist nicht noetig.
 * - Es gibt keine zweite Bewegungsquelle, die mit der Animation um denselben
 *   transform streiten koennte.
 *
 * Umgerechnet wird ueber die Breite eines Durchlaufs: in einer Periode wandert
 * das Band genau um diese Breite. Beides wird bei jeder Beruehrung frisch
 * gelesen, damit Fensterbreite und der mobile Tempofaktor von allein stimmen.
 *
 * === Waagrecht oder senkrecht ===
 * Zwei Sicherungen. touch-action: pan-y pinch-zoom im Stylesheet gibt dem
 * Browser das senkrechte Scrollen und das Zoomen und behaelt nur das
 * waagrechte Ziehen -- die Entscheidung trifft damit die Plattform, nicht eine
 * eigene Heuristik. Zusaetzlich die Schwelle unten: wird die Bewegung zuerst
 * senkrecht, ist die Geste fuer das Band bis zum Loslassen erledigt.
 *
 * === Keine Geraeteweiche ===
 * Es wird nirgends nach Zeigerart oder Bildschirmbreite gefragt. Gehandelt
 * wird auf pointerType === 'touch', also auf das einzelne Ereignis. Auf einem
 * Notebook mit Touchscreen laeuft deshalb beides nebeneinander: der Finger
 * schiebt, die Maus haelt beim Ueberfahren an. Was dort trotzdem zu regeln
 * war, steht bei markTouch().
 */

const TOUCH_CLASS = 'label-marquee--touch'

/** Ab hier gilt eine Bewegung als gerichtet, in px. */
const DIRECTION_THRESHOLD = 6
/** Abklingzeit des Schwungs: nach dieser Spanne ist gut ein Drittel uebrig. */
const GLIDE_TAU = 320
/** Darunter ist der Schwung nicht mehr zu sehen, in px/ms. */
const GLIDE_STOP = 0.04
/** Deckel gegen unsinnige Werte aus einem einzelnen Ereignis, in px/ms. */
const MAX_VELOCITY = 4
/** Nach einer Beruehrung nachgeschobene Mausereignisse ueberhoeren, in ms. */
const SYNTHETIC_MOUSE_WINDOW = 700

export default function LabelMarqueeDrag({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = boxRef.current
    const track = box?.firstElementChild as HTMLElement | null | undefined
    const run = track?.firstElementChild as HTMLElement | null | undefined
    if (!box || !track || !run) return

    let anim: Animation | null = null
    let pointer: number | null = null
    let dragging = false
    let wasRunning = false
    let startX = 0, startY = 0
    let baseTime = 0, period = 0, msPerPx = 0
    let lastX = 0, lastAt = 0, velocity = 0
    let frame = 0
    let lastTouchAt = 0

    const time = () => Number(anim?.currentTime ?? 0)
    const setTime = (t: number) => {
      // Modulo, damit die Zeit nie negativ und nie unbegrenzt wird -- das ist
      // die ganze Nahtlogik.
      if (anim) anim.currentTime = ((t % period) + period) % period
    }

    /**
     * Auf einem Geraet mit Maus und Touchscreen bleibt :hover nach einer
     * Beruehrung an dem Element haengen, das beruehrt wurde. Die Hover-Regel
     * wuerde das Band dann anhalten, obwohl der Finger laengst weg ist, und es
     * bliebe stehen, bis die Maus irgendwohin bewegt wird. Solange die letzte
     * Eingabe eine Beruehrung war, nimmt diese Klasse die Regel aus dem Spiel.
     * Aufgehoben wird sie von einer echten Mausbewegung -- die kuenstlichen
     * Mausereignisse, die der Browser einer Beruehrung hinterherschickt,
     * kommen sofort danach und werden ueberhoert.
     */
    const unmarkTouch = () => {
      if (performance.now() - lastTouchAt < SYNTHETIC_MOUSE_WINDOW) return
      box.classList.remove(TOUCH_CLASS)
      window.removeEventListener('mousemove', unmarkTouch)
    }
    const markTouch = () => {
      lastTouchAt = performance.now()
      if (box.classList.contains(TOUCH_CLASS)) return
      box.classList.add(TOUCH_CLASS)
      window.addEventListener('mousemove', unmarkTouch, { passive: true })
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || pointer !== null) return
      anim = track.getAnimations()[0] ?? null
      if (!anim) return
      const duration = Number(anim.effect?.getComputedTiming().duration ?? 0)
      const width = run.offsetWidth
      if (!duration || !width) { anim = null; return }

      cancelAnimationFrame(frame)
      markTouch()
      period = duration
      msPerPx = duration / width
      pointer = e.pointerId
      startX = lastX = e.clientX
      startY = e.clientY
      lastAt = e.timeStamp
      velocity = 0
      dragging = false
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointer || !anim) return
      const dx = e.clientX - startX

      if (!dragging) {
        const dy = e.clientY - startY
        // Zuerst senkrecht: die Geste gehoert dem Scrollen, Band raushalten.
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > DIRECTION_THRESHOLD) {
          pointer = null
          anim = null
          return
        }
        if (Math.abs(dx) < DIRECTION_THRESHOLD) return
        dragging = true
        // Der Laufzustand von jetzt ist zugleich die Antwort auf
        // prefers-reduced-motion: steht das Band ohnehin, wird es am Ende
        // nicht angeworfen und laeuft waehrend des Schwungs nicht mit.
        wasRunning = anim.playState === 'running'
        anim.pause()
        baseTime = time()
        box.setPointerCapture(e.pointerId)
      }

      if (e.timeStamp > lastAt) velocity = (e.clientX - lastX) / (e.timeStamp - lastAt)
      lastX = e.clientX
      lastAt = e.timeStamp
      // Aus der Gesamtstrecke, nicht aufsummiert: so kann sich nichts verlaufen.
      setTime(baseTime - dx * msPerPx)
    }

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      const glide = dragging && anim !== null
      pointer = null
      dragging = false
      markTouch()
      if (!glide) { anim = null; return }

      let v = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity))
      let prev = performance.now()
      const step = (now: number) => {
        // Deckel gegen einen Sprung, wenn der Reiter zwischendurch weg war.
        const dt = Math.min(now - prev, 50)
        prev = now
        v *= Math.exp(-dt / GLIDE_TAU)
        // Eigenlauf plus abklingender Rest der Wischbewegung: es faellt aus der
        // Wischgeschwindigkeit in die normale, statt zurueckzuspringen.
        setTime(time() + (wasRunning ? dt : 0) - v * dt * msPerPx)
        if (Math.abs(v) > GLIDE_STOP) frame = requestAnimationFrame(step)
        else if (wasRunning) anim?.play()
      }
      frame = requestAnimationFrame(step)
    }

    box.addEventListener('pointerdown', onDown, { passive: true })
    box.addEventListener('pointermove', onMove, { passive: true })
    box.addEventListener('pointerup', onUp, { passive: true })
    box.addEventListener('pointercancel', onUp, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', unmarkTouch)
      box.removeEventListener('pointerdown', onDown)
      box.removeEventListener('pointermove', onMove)
      box.removeEventListener('pointerup', onUp)
      box.removeEventListener('pointercancel', onUp)
    }
  }, [])

  return <div className="label-marquee" ref={boxRef}>{children}</div>
}
