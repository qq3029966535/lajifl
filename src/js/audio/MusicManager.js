/**
 * 背景音乐管理器
 * 管理游戏中的背景音乐和环境音效
 */
import { audioManager } from './AudioManager.js';

export class MusicManager {
    constructor() {
        this.audioContext = null;
        this.currentTrack = null;
        this.ambientSources = new Map();
        this.musicVolume = 0.4;
        this.ambientVolume = 0.2;
        this.isPlaying = false;
        this.currentScene = 'menu';
        
        this.initializeAudioContext();
        this.createBackgroundMusic();
    }

    /**
     * 初始化音频上下文
     */
    async initializeAudioContext() {
        try {
            this.audioContext = audioManager.audioContext;
            console.log('音乐管理器初始化成功');
        } catch (error) {
            console.warn('音乐管理器初始化失败:', error);
        }
    }

    /**
     * 创建背景音乐
     */
    createBackgroundMusic() {
        // 菜单音乐 - 轻松愉快的旋律
        this.createMenuMusic();
        
        // 游戏音乐 - 专注但不紧张的背景音
        this.createGameMusic();
        
        // 胜利音乐 - 庆祝旋律
        this.createVictoryMusic();
    }

    /**
     * 创建菜单音乐
     */
    createMenuMusic() {
        if (!this.audioContext) return;
        
        const menuMelody = [
            { freq: 523.25, duration: 0.5 }, // C5
            { freq: 587.33, duration: 0.5 }, // D5
            { freq: 659.25, duration: 0.5 }, // E5
            { freq: 698.46, duration: 0.5 }, // F5
            { freq: 783.99, duration: 1.0 }, // G5
            { freq: 659.25, duration: 0.5 }, // E5
            { freq: 523.25, duration: 1.0 }, // C5
            { freq: 587.33, duration: 0.5 }, // D5
            { freq: 659.25, duration: 1.5 }  // E5
        ];
        
        const menuMusic = this.generateMelodyTrack(menuMelody, 'sine', true);
        audioManager.sounds.set('menuMusic', menuMusic);
    }

    /**
     * 创建游戏音乐
     */
    createGameMusic() {
        if (!this.audioContext) return;
        
        const gameMelody = [
            { freq: 440.00, duration: 0.8 }, // A4
            { freq: 493.88, duration: 0.4 }, // B4
            { freq: 523.25, duration: 0.8 }, // C5
            { freq: 587.33, duration: 0.4 }, // D5
            { freq: 659.25, duration: 1.2 }, // E5
            { freq: 587.33, duration: 0.4 }, // D5
            { freq: 523.25, duration: 0.8 }, // C5
            { freq: 493.88, duration: 0.8 }, // B4
            { freq: 440.00, duration: 1.6 }  // A4
        ];
        
        const gameMusic = this.generateMelodyTrack(gameMelody, 'triangle', true);
        audioManager.sounds.set('gameMusic', gameMusic);
    }

    /**
     * 创建胜利音乐
     */
    createVictoryMusic() {
        if (!this.audioContext) return;
        
        const victoryMelody = [
            { freq: 523.25, duration: 0.3 }, // C5
            { freq: 659.25, duration: 0.3 }, // E5
            { freq: 783.99, duration: 0.3 }, // G5
            { freq: 1046.50, duration: 0.6 }, // C6
            { freq: 783.99, duration: 0.3 }, // G5
            { freq: 1046.50, duration: 0.9 }, // C6
            { freq: 1174.66, duration: 0.3 }, // D6
            { freq: 1318.51, duration: 1.2 }  // E6
        ];
        
        const victoryMusic = this.generateMelodyTrack(victoryMelody, 'sine', false);
        audioManager.sounds.set('victoryMusic', victoryMusic);
    }

    /**
     * 生成旋律音轨
     * @param {Array} melody - 旋律数组
     * @param {string} waveType - 波形类型
     * @param {boolean} loop - 是否循环
     */
    generateMelodyTrack(melody, waveType = 'sine', loop = false) {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
        const loopCount = loop ? 4 : 1; // 循环4次
        const length = sampleRate * totalDuration * loopCount;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate); // 立体声
        
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            
            for (let loopIndex = 0; loopIndex < loopCount; loopIndex++) {
                let currentTime = loopIndex * totalDuration;
                
                melody.forEach(note => {
                    const startSample = Math.floor(currentTime * sampleRate);
                    const noteDuration = note.duration;
                    const noteLength = Math.floor(noteDuration * sampleRate);
                    
                    for (let i = 0; i < noteLength; i++) {
                        const t = i / sampleRate;
                        const globalT = currentTime + t;
                        
                        // 音符包络
                        const attack = Math.min(1, t / 0.1); // 0.1秒攻击时间
                        const decay = Math.max(0, 1 - Math.max(0, t - noteDuration + 0.2) / 0.2); // 0.2秒衰减
                        const envelope = attack * decay * 0.3; // 降低整体音量
                        
                        let sample = 0;
                        
                        // 主旋律
                        switch (waveType) {
                            case 'sine':
                                sample = Math.sin(2 * Math.PI * note.freq * t) * envelope;
                                break;
                            case 'triangle':
                                sample = (2 * Math.abs(2 * (t * note.freq - Math.floor(t * note.freq + 0.5))) - 1) * envelope;
                                break;
                        }
                        
                        // 添加和声（仅左声道）
                        if (channel === 0) {
                            const harmonyFreq = note.freq * 1.25; // 五度和声
                            sample += Math.sin(2 * Math.PI * harmonyFreq * t) * envelope * 0.3;
                        }
                        
                        // 添加低音（仅右声道）
                        if (channel === 1) {
                            const bassFreq = note.freq * 0.5; // 低八度
                            sample += Math.sin(2 * Math.PI * bassFreq * t) * envelope * 0.4;
                        }
                        
                        if (startSample + i < length) {
                            data[startSample + i] = sample;
                        }
                    }
                    
                    currentTime += noteDuration;
                });
            }
        }
        
        return buffer;
    }

    /**
     * 播放背景音乐
     * @param {string} trackName - 音轨名称
     * @param {boolean} loop - 是否循环
     */
    playMusic(trackName, loop = true) {
        this.stopMusic();
        
        if (!this.audioContext || audioManager.muted) return;
        
        const musicBuffer = audioManager.sounds.get(trackName);
        if (!musicBuffer) {
            console.warn(`音乐 ${trackName} 不存在`);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = musicBuffer;
            source.loop = loop;
            
            // 设置音量
            gainNode.gain.setValueAtTime(
                this.musicVolume * audioManager.masterVolume,
                this.audioContext.currentTime
            );
            
            // 连接音频节点
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 播放
            source.start(this.audioContext.currentTime);
            
            this.currentTrack = source;
            this.isPlaying = true;
            
            console.log(`开始播放音乐: ${trackName}`);
            
        } catch (error) {
            console.warn('播放音乐失败:', error);
        }
    }

    /**
     * 停止背景音乐
     */
    stopMusic() {
        if (this.currentTrack) {
            try {
                this.currentTrack.stop();
            } catch (error) {
                console.warn('停止音乐失败:', error);
            }
            this.currentTrack = null;
            this.isPlaying = false;
        }
    }

    /**
     * 播放环境音效
     * @param {Array} ambientTypes - 环境音效类型数组
     */
    playAmbientSounds(ambientTypes = ['bird', 'water', 'wind']) {
        this.stopAmbientSounds();
        
        if (!this.audioContext || audioManager.muted) return;
        
        ambientTypes.forEach(type => {
            const source = this.createAmbientSource(type);
            if (source) {
                this.ambientSources.set(type, source);
            }
        });
    }

    /**
     * 创建环境音效源
     * @param {string} type - 环境音效类型
     */
    createAmbientSource(type) {
        const soundBuffer = audioManager.sounds.get(type);
        if (!soundBuffer) return null;
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = soundBuffer;
            source.loop = true;
            
            // 设置音量（环境音效更轻）
            const volume = this.ambientVolume * audioManager.masterVolume * 0.5;
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            
            // 连接音频节点
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 随机延迟开始，创造自然感
            const delay = Math.random() * 2;
            source.start(this.audioContext.currentTime + delay);
            
            return source;
            
        } catch (error) {
            console.warn(`创建环境音效 ${type} 失败:`, error);
            return null;
        }
    }

    /**
     * 停止环境音效
     */
    stopAmbientSounds() {
        for (const [type, source] of this.ambientSources) {
            try {
                source.stop();
            } catch (error) {
                console.warn(`停止环境音效 ${type} 失败:`, error);
            }
        }
        this.ambientSources.clear();
    }

    /**
     * 切换到菜单场景音乐
     */
    switchToMenuMusic() {
        this.currentScene = 'menu';
        this.playMusic('menuMusic', true);
        this.stopAmbientSounds();
    }

    /**
     * 切换到游戏场景音乐
     */
    switchToGameMusic() {
        this.currentScene = 'game';
        this.playMusic('gameMusic', true);
        this.playAmbientSounds(['bird', 'water']);
    }

    /**
     * 播放胜利音乐
     */
    playVictoryMusic() {
        this.stopMusic();
        this.stopAmbientSounds();
        this.playMusic('victoryMusic', false);
    }

    /**
     * 淡入音乐
     * @param {string} trackName - 音轨名称
     * @param {number} duration - 淡入时长（秒）
     */
    fadeInMusic(trackName, duration = 2) {
        this.playMusic(trackName, true);
        
        if (this.currentTrack && this.audioContext) {
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(
                this.musicVolume * audioManager.masterVolume,
                this.audioContext.currentTime + duration
            );
        }
    }

    /**
     * 淡出音乐
     * @param {number} duration - 淡出时长（秒）
     */
    fadeOutMusic(duration = 2) {
        if (this.currentTrack && this.audioContext) {
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(
                this.musicVolume * audioManager.masterVolume,
                this.audioContext.currentTime
            );
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            
            setTimeout(() => {
                this.stopMusic();
            }, duration * 1000);
        }
    }

    /**
     * 设置音乐音量
     * @param {number} volume - 音量 (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 设置环境音效音量
     * @param {number} volume - 音量 (0-1)
     */
    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 暂停音乐
     */
    pauseMusic() {
        if (this.currentTrack && this.audioContext) {
            this.audioContext.suspend();
        }
    }

    /**
     * 恢复音乐
     */
    resumeMusic() {
        if (this.currentTrack && this.audioContext) {
            this.audioContext.resume();
        }
    }

    /**
     * 获取当前播放状态
     */
    getPlaybackState() {
        return {
            isPlaying: this.isPlaying,
            currentScene: this.currentScene,
            musicVolume: this.musicVolume,
            ambientVolume: this.ambientVolume,
            ambientCount: this.ambientSources.size
        };
    }

    /**
     * 销毁音乐管理器
     */
    destroy() {
        this.stopMusic();
        this.stopAmbientSounds();
        console.log('音乐管理器已销毁');
    }
}

// 创建全局音乐管理器实例
export const musicManager = new MusicManager();