/**
 * 音频管理器
 * 管理游戏中的所有音效和背景音乐
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.musicTracks = new Map();
        this.currentMusic = null;
        this.masterVolume = 1.0;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.6;
        this.muted = false;
        
        this.initializeAudioContext();
        this.createSynthesizedSounds();
    }

    /**
     * 初始化音频上下文
     */
    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 处理浏览器自动播放策略
            if (this.audioContext.state === 'suspended') {
                document.addEventListener('click', () => {
                    this.audioContext.resume();
                }, { once: true });
            }
            
            console.log('音频系统初始化成功');
        } catch (error) {
            console.warn('音频系统初始化失败:', error);
        }
    }

    /**
     * 创建合成音效
     */
    createSynthesizedSounds() {
        // 成功分类音效 - 轻快电子音
        this.createSuccessSound();
        
        // 失败音效 - 低沉警报声
        this.createErrorSound();
        
        // 按钮点击音效
        this.createClickSound();
        
        // 垃圾桶放置音效
        this.createPlaceSound();
        
        // 关卡完成音效
        this.createLevelCompleteSound();
        
        // 游戏失败音效
        this.createGameOverSound();
        
        // 背景环境音效
        this.createAmbientSounds();
    }

    /**
     * 创建成功音效
     */
    createSuccessSound() {
        const soundData = this.generateTone([523.25, 659.25, 783.99], 0.3, 'sine');
        this.sounds.set('success', soundData);
    }

    /**
     * 创建错误音效
     */
    createErrorSound() {
        const soundData = this.generateTone([220, 196, 174.61], 0.5, 'sawtooth');
        this.sounds.set('error', soundData);
    }

    /**
     * 创建点击音效
     */
    createClickSound() {
        const soundData = this.generateTone([800], 0.1, 'square');
        this.sounds.set('click', soundData);
    }

    /**
     * 创建放置音效
     */
    createPlaceSound() {
        const soundData = this.generateTone([400, 500], 0.2, 'sine');
        this.sounds.set('place', soundData);
    }

    /**
     * 创建关卡完成音效
     */
    createLevelCompleteSound() {
        const soundData = this.generateMelody([
            { freq: 523.25, duration: 0.2 },
            { freq: 659.25, duration: 0.2 },
            { freq: 783.99, duration: 0.2 },
            { freq: 1046.50, duration: 0.4 }
        ], 'sine');
        this.sounds.set('levelComplete', soundData);
    }

    /**
     * 创建游戏结束音效
     */
    createGameOverSound() {
        const soundData = this.generateMelody([
            { freq: 261.63, duration: 0.3 },
            { freq: 246.94, duration: 0.3 },
            { freq: 220.00, duration: 0.3 },
            { freq: 196.00, duration: 0.5 }
        ], 'triangle');
        this.sounds.set('gameOver', soundData);
    }

    /**
     * 创建环境音效
     */
    createAmbientSounds() {
        // 鸟鸣声
        const birdSound = this.generateBirdChirp();
        this.sounds.set('bird', birdSound);
        
        // 流水声
        const waterSound = this.generateWaterSound();
        this.sounds.set('water', waterSound);
        
        // 风声
        const windSound = this.generateWindSound();
        this.sounds.set('wind', windSound);
    }

    /**
     * 生成音调
     * @param {Array} frequencies - 频率数组
     * @param {number} duration - 持续时间
     * @param {string} waveType - 波形类型
     */
    generateTone(frequencies, duration, waveType = 'sine') {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            let sample = 0;
            
            frequencies.forEach((freq, index) => {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 3); // 指数衰减包络
                
                switch (waveType) {
                    case 'sine':
                        sample += Math.sin(2 * Math.PI * freq * t) * envelope;
                        break;
                    case 'square':
                        sample += Math.sign(Math.sin(2 * Math.PI * freq * t)) * envelope;
                        break;
                    case 'sawtooth':
                        sample += (2 * (t * freq - Math.floor(t * freq + 0.5))) * envelope;
                        break;
                    case 'triangle':
                        sample += (2 * Math.abs(2 * (t * freq - Math.floor(t * freq + 0.5))) - 1) * envelope;
                        break;
                }
            });
            
            data[i] = sample / frequencies.length * 0.3; // 归一化并降低音量
        }
        
        return buffer;
    }

    /**
     * 生成旋律
     * @param {Array} notes - 音符数组
     * @param {string} waveType - 波形类型
     */
    generateMelody(notes, waveType = 'sine') {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
        const length = sampleRate * totalDuration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        let currentTime = 0;
        
        notes.forEach(note => {
            const startSample = Math.floor(currentTime * sampleRate);
            const noteDuration = note.duration;
            const noteLength = Math.floor(noteDuration * sampleRate);
            
            for (let i = 0; i < noteLength; i++) {
                const t = i / sampleRate;
                const envelope = Math.exp(-t * 2) * (1 - t / noteDuration);
                
                let sample = 0;
                switch (waveType) {
                    case 'sine':
                        sample = Math.sin(2 * Math.PI * note.freq * t) * envelope;
                        break;
                    case 'triangle':
                        sample = (2 * Math.abs(2 * (t * note.freq - Math.floor(t * note.freq + 0.5))) - 1) * envelope;
                        break;
                }
                
                if (startSample + i < length) {
                    data[startSample + i] = sample * 0.3;
                }
            }
            
            currentTime += noteDuration;
        });
        
        return buffer;
    }

    /**
     * 生成鸟鸣声
     */
    generateBirdChirp() {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 2.0;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const freq = 1000 + 500 * Math.sin(t * 10) + 200 * Math.sin(t * 30);
            const envelope = Math.exp(-t * 1.5) * Math.sin(t * 8);
            
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.1;
        }
        
        return buffer;
    }

    /**
     * 生成流水声
     */
    generateWaterSound() {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 5.0;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // 多层噪声模拟流水声
            for (let j = 0; j < 10; j++) {
                const freq = 100 + j * 50;
                const noise = (Math.random() - 0.5) * 2;
                sample += noise * Math.sin(2 * Math.PI * freq * t) * (1 / (j + 1));
            }
            
            data[i] = sample * 0.05;
        }
        
        return buffer;
    }

    /**
     * 生成风声
     */
    generateWindSound() {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 4.0;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // 低频噪声模拟风声
            for (let j = 0; j < 5; j++) {
                const freq = 20 + j * 10;
                const noise = (Math.random() - 0.5) * 2;
                const envelope = 0.5 + 0.5 * Math.sin(t * 0.5);
                sample += noise * Math.sin(2 * Math.PI * freq * t) * envelope * (1 / (j + 1));
            }
            
            data[i] = sample * 0.03;
        }
        
        return buffer;
    }

    /**
     * 播放音效
     * @param {string} soundName - 音效名称
     * @param {Object} options - 播放选项
     */
    playSound(soundName, options = {}) {
        if (!this.audioContext || this.muted) return;
        
        const soundBuffer = this.sounds.get(soundName);
        if (!soundBuffer) {
            console.warn(`音效 ${soundName} 不存在`);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = soundBuffer;
            
            // 设置音量
            const volume = (options.volume || 1) * this.sfxVolume * this.masterVolume;
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            
            // 连接音频节点
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 播放
            source.start(this.audioContext.currentTime);
            
            // 如果是循环音效
            if (options.loop) {
                source.loop = true;
                return source; // 返回source以便停止
            }
            
        } catch (error) {
            console.warn('播放音效失败:', error);
        }
    }

    /**
     * 播放成功音效
     */
    playSuccessSound() {
        this.playSound('success');
    }

    /**
     * 播放错误音效
     */
    playErrorSound() {
        this.playSound('error');
        
        // 添加屏幕震动效果
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    /**
     * 播放点击音效
     */
    playClickSound() {
        this.playSound('click', { volume: 0.5 });
    }

    /**
     * 播放放置音效
     */
    playPlaceSound() {
        this.playSound('place');
    }

    /**
     * 播放关卡完成音效
     */
    playLevelCompleteSound() {
        this.playSound('levelComplete');
    }

    /**
     * 播放游戏结束音效
     */
    playGameOverSound() {
        this.playSound('gameOver');
    }

    /**
     * 播放环境音效
     * @param {string} type - 环境音效类型 (bird, water, wind)
     */
    playAmbientSound(type) {
        return this.playSound(type, { loop: true, volume: 0.3 });
    }

    /**
     * 停止音效
     * @param {AudioBufferSourceNode} source - 音频源
     */
    stopSound(source) {
        if (source && source.stop) {
            try {
                source.stop();
            } catch (error) {
                console.warn('停止音效失败:', error);
            }
        }
    }

    /**
     * 设置主音量
     * @param {number} volume - 音量 (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 设置音效音量
     * @param {number} volume - 音量 (0-1)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 设置音乐音量
     * @param {number} volume - 音量 (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 静音/取消静音
     * @param {boolean} mute - 是否静音
     */
    setMuted(mute) {
        this.muted = mute;
        console.log(mute ? '音频已静音' : '音频已取消静音');
    }

    /**
     * 切换静音状态
     */
    toggleMute() {
        this.setMuted(!this.muted);
    }

    /**
     * 获取音频状态
     */
    getAudioState() {
        return {
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume,
            musicVolume: this.musicVolume,
            muted: this.muted,
            contextState: this.audioContext ? this.audioContext.state : 'unavailable'
        };
    }

    /**
     * 销毁音频管理器
     */
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.sounds.clear();
        this.musicTracks.clear();
        console.log('音频管理器已销毁');
    }
}

// 创建全局音频管理器实例
export const audioManager = new AudioManager();