/**
 * Kitchen Sound Notification Service
 * Handles audio alerts for kitchen workflow events
 */

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  newOrderEnabled: boolean;
  orderReadyEnabled: boolean;
  takeawayReadyEnabled: boolean;
}

export interface SoundEvent {
  type: 'new_order' | 'order_ready' | 'takeaway_ready';
  orderId: string;
  metadata?: Record<string, any>;
}

class KitchenSoundService {
  private audioContext: AudioContext | null = null;
  private settings: SoundSettings = {
    enabled: true,
    volume: 0.7,
    newOrderEnabled: true,
    orderReadyEnabled: true,
    takeawayReadyEnabled: true,
  };
  
  private soundCache = new Map<string, AudioBuffer>();
  private isInitialized = false;


  constructor() {
    this.loadSettings();
  }

  /**
   * Initialize audio context and load sound files
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize audio context without microphone permissions
      await this.initializeAudioContext();

      // Load sound files
      await this.loadSoundFiles();

      this.isInitialized = true;
      console.log('✅ Kitchen Sound Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Kitchen Sound Service:', error);
      throw error;
    }
  }

  /**
   * Initialize audio context without requiring microphone permissions
   */
  private async initializeAudioContext(): Promise<void> {
    if (!this.audioContext) {
      // Create AudioContext without microphone access
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
  }

  /**
   * Load sound files into memory
   */
  private async loadSoundFiles(): Promise<void> {
    const sounds = {
      new_order: '/sounds/kitchen/new-order.mp3',
      order_ready: '/sounds/kitchen/order-ready.mp3',
      takeaway_ready: '/sounds/kitchen/takeaway-ready.mp3',
    };

    const loadPromises = Object.entries(sounds).map(async ([key, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          // Fallback to generated sounds if files don't exist
          const buffer = await this.generateSound(key as keyof typeof sounds);
          this.soundCache.set(key, buffer);
          return;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.soundCache.set(key, audioBuffer);
      } catch (error) {
        console.warn(`Failed to load sound ${key}, using generated sound`);
        const buffer = await this.generateSound(key as keyof typeof sounds);
        this.soundCache.set(key, buffer);
      }
    });

    await Promise.all(loadPromises);
    console.log('✅ Sound files loaded');
  }

  /**
   * Generate programmatic sounds as fallback
   */
  private async generateSound(type: string): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3; // 300ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Generate different tones for different events
    const frequencies = {
      new_order: [800, 1000], // Pleasant chime
      order_ready: [600, 800, 1000], // Success sound
      takeaway_ready: [400, 600, 400], // Distinctive pattern
    };

    const freqs = frequencies[type as keyof typeof frequencies] || [440];
    
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      let sample = 0;
      
      freqs.forEach((freq, index) => {
        const phase = time * freq * 2 * Math.PI;
        const envelope = Math.exp(-time * 3); // Decay envelope
        sample += Math.sin(phase) * envelope * (0.3 / freqs.length);
      });
      
      channelData[i] = sample;
    }

    return buffer;
  }

  /**
   * Play sound for specific event
   */
  async playSound(event: SoundEvent): Promise<void> {
    if (!this.settings.enabled || !this.isInitialized || !this.audioContext) {
      return;
    }

    // Check if specific sound type is enabled
    const soundTypeEnabled = {
      new_order: this.settings.newOrderEnabled,
      order_ready: this.settings.orderReadyEnabled,
      takeaway_ready: this.settings.takeawayReadyEnabled,
    };

    if (!soundTypeEnabled[event.type]) {
      return;
    }

    try {
      // Ensure audio context is running (resume if suspended)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const audioBuffer = this.soundCache.get(event.type);
      if (!audioBuffer) {
        console.warn(`Sound not found for event: ${event.type}`);
        return;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      gainNode.gain.value = this.settings.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();

      console.log(`🔊 Playing sound for: ${event.type}`);
    } catch (error) {
      console.error('Failed to play sound:', error);
      // Try to resume audio context if it was suspended
      if (this.audioContext?.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (resumeError) {
          console.error('Failed to resume audio context:', resumeError);
        }
      }
    }
  }

  /**
   * Play new order notification
   */
  async playNewOrderSound(orderId: string): Promise<void> {
    await this.playSound({
      type: 'new_order',
      orderId,
      metadata: { timestamp: Date.now() }
    });
  }

  /**
   * Play order ready notification
   */
  async playOrderReadySound(orderId: string, orderType: string): Promise<void> {
    const soundType = orderType === 'takeout' ? 'takeaway_ready' : 'order_ready';
    await this.playSound({
      type: soundType,
      orderId,
      metadata: { orderType, timestamp: Date.now() }
    });
  }

  /**
   * Update sound settings
   */
  updateSettings(newSettings: Partial<SoundSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    console.log('🔧 Sound settings updated:', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('kitchen_sound_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('kitchen_sound_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save sound settings:', error);
    }
  }

  /**
   * Test sound playback
   */
  async testSound(type: SoundEvent['type']): Promise<void> {
    await this.playSound({
      type,
      orderId: 'test-order',
      metadata: { test: true }
    });
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.soundCache.clear();
    this.isInitialized = false;
    console.log('🧹 Kitchen Sound Service disposed');
  }
}

// Create singleton instance
export const kitchenSoundService = new KitchenSoundService();

// Auto-initialize on first import (with error handling)
kitchenSoundService.initialize().catch(error => {
  console.warn('Kitchen Sound Service initialization failed:', error);
});

export default kitchenSoundService;
