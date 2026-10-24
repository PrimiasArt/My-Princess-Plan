// Cute Web Audio API Sound Effects & Pastel Music Box Synthesizer

class CuteSoundManager {
  private ctx: AudioContext | null = null;
  public enabled = true;
  public bgmPlaying = false;
  private bgmTimer: number | null = null;
  private bgmStep = 0;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Cute bubble pop when picking up or tapping a sticker
  public playPop() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // Cute double-plop when dropping a sticker into a time slot
  public playDrop() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5 - E5 - G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.055;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.06, start + 0.1);

      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  // Playful bouncy sound when sticking a free-floating expression sticker
  public playBoing() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.24);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.27);
  }

  // Sweet chime when sending a Sticky Note
  public playNoteChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    const melody = [587.33, 783.99, 987.77, 1174.66]; // D5 - G5 - B5 - D6
    melody.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  // Royal Princess Fanfare when clicking "Công chúa Duyệt Plan!"
  public playRoyalFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const sequence = [
      { freq: 523.25, delay: 0, dur: 0.12 },    // C5
      { freq: 659.25, delay: 0.11, dur: 0.12 }, // E5
      { freq: 783.99, delay: 0.22, dur: 0.12 }, // G5
      { freq: 1046.5, delay: 0.34, dur: 0.28 }, // C6
      { freq: 987.77, delay: 0.56, dur: 0.12 }, // B5
      { freq: 1046.5, delay: 0.68, dur: 0.45 }, // C6
    ];

    sequence.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  }

  // Cute pouting / demanding boba sound ("Giận dỗi / Đòi đổi món")
  public playPout() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [622.25, 587.33, 523.25, 466.16]; // Eb5 -> D5 -> C5 -> Bb4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.linearRampToValueAtTime(freq * 0.94, start + 0.09);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.13);
    });
  }

  // Heart / Boba sparkle sound
  public playSparkle() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [880, 1108.73, 1318.51, 1760];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.18);
    });
  }

  // Toggle gentle pastel music-box melody in background
  public toggleMusicBox(): boolean {
    if (this.bgmPlaying) {
      this.stopMusicBox();
      return false;
    }
    const ctx = this.getContext();
    if (!ctx) return false;

    this.bgmPlaying = true;
    const lullabyNotes = [
      523.25, 659.25, 783.99, 659.25,
      587.33, 698.46, 880.00, 698.46,
      523.25, 659.25, 1046.50, 783.99,
      698.46, 659.25, 587.33, 523.25,
    ];

    const playTick = () => {
      if (!this.bgmPlaying || !this.enabled) return;
      const audioCtx = this.getContext();
      if (!audioCtx) return;

      const freq = lullabyNotes[this.bgmStep % lullabyNotes.length];
      this.bgmStep += 1;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.48);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    };

    playTick();
    this.bgmTimer = window.setInterval(playTick, 520);
    return true;
  }

  public stopMusicBox() {
    this.bgmPlaying = false;
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const soundFX = new CuteSoundManager();
