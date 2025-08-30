"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Copy, Trash2, Play, Pause, StopCircle, Volume2, Zap, Sun, Smartphone, Upload, Download, Eye, Languages, Code, Settings } from 'lucide-react';

// Morse code alphabet
const MORSE_CODE_MAP: { [key: string]: string } = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
  'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
  'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.',
  '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
  ' ': '/'
};

const REVERSE_MORSE_CODE_MAP: { [key: string]: string } = {};
Object.keys(MORSE_CODE_MAP).forEach(key => {
  REVERSE_MORSE_CODE_MAP[MORSE_CODE_MAP[key]] = key;
});

// Morse code timing constants (in milliseconds)
const DOT_DURATION = 50;
const DASH_DURATION = DOT_DURATION * 3;
const SYMBOL_GAP = DOT_DURATION;
const LETTER_GAP = DOT_DURATION * 3;
const WORD_GAP = DOT_DURATION * 7;

export default function MorseCodeGeneratorPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('text-to-morse');
  const [inputText, setInputText] = useState('');
  const [inputMorse, setInputMorse] = useState('');
  const [outputMorse, setOutputMorse] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [visualEnabled, setVisualEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [pitch, setPitch] = useState(600);
  const [speed, setSpeed] = useState(1);
  const [visualActive, setVisualActive] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const pausedPositionRef = useRef(0);
  const morseSequenceRef = useRef<string>('');

  // Convert text to Morse code
  const textToMorse = (text: string): string => {
    return text
      .toUpperCase()
      .split('')
      .map(char => MORSE_CODE_MAP[char] || char)
      .join(' ');
  };

  // Convert Morse code to text
  const morseToText = (morse: string): string => {
    return morse
      .split('  ') // Split by words (double space)
      .map(word => 
        word
          .split(' ') // Split by letters
          .map(letter => REVERSE_MORSE_CODE_MAP[letter] || letter)
          .join('')
      )
      .join(' ');
  };

  // Update outputs when inputs change
  useEffect(() => {
    if (activeTab === 'text-to-morse') {
      if (inputText) {
        setOutputMorse(textToMorse(inputText));
      } else {
        setOutputMorse('');
      }
    } else {
      if (inputMorse) {
        setOutputText(morseToText(inputMorse));
      } else {
        setOutputText('');
      }
    }
  }, [inputText, inputMorse, activeTab]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  // Play audio beep
  const playBeep = (duration: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioContext = audioContextRef.current;
    
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = pitch;
    gainNode.gain.value = volume;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
    
    oscillatorRef.current = oscillator;
  };

  // Vibrate device
  const vibrate = (duration: number) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  // Flash light (stub implementation - would require more complex API access)
  const flashLight = (duration: number) => {
    // This is a simplified implementation
    // Real implementation would require MediaDevices API and device permissions
    console.log(`Flashing light for ${duration}ms`);
  };

  // Visual signal
  const visualSignal = (duration: number) => {
    if (visualRef.current) {
      setVisualActive(true);
      setTimeout(() => {
        setVisualActive(false);
      }, duration);
    }
  };

  // Play a single Morse code symbol
  const playSymbol = (symbol: string, callback: () => void) => {
    const adjustedDot = DOT_DURATION / speed;
    const adjustedDash = DASH_DURATION / speed;
    const adjustedGap = SYMBOL_GAP / speed;
    
    if (symbol === '.') {
      if (audioEnabled) playBeep(adjustedDot);
      if (vibrationEnabled) vibrate(adjustedDot);
      if (visualEnabled) {
        flashLight(adjustedDot);
        visualSignal(adjustedDot);
      }
      
      playTimeoutRef.current = setTimeout(() => {
        callback();
      }, adjustedDot + adjustedGap);
    } else if (symbol === '-') {
      if (audioEnabled) playBeep(adjustedDash);
      if (vibrationEnabled) vibrate(adjustedDash);
      if (visualEnabled) {
        flashLight(adjustedDash);
        visualSignal(adjustedDash);
      }
      
      playTimeoutRef.current = setTimeout(() => {
        callback();
      }, adjustedDash + adjustedGap);
    } else {
      // Gap between symbols
      playTimeoutRef.current = setTimeout(() => {
        callback();
      }, adjustedGap);
    }
  };

  // Play entire Morse code sequence
  const playMorseSequence = (morse: string, startPosition: number = 0) => {
    if (!morse || (isPlayingRef.current && !isPausedRef.current)) return;
    
    // Store the sequence for pause/resume
    morseSequenceRef.current = morse;
    
    isPlayingRef.current = true;
    isPausedRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    
    const symbols = morse.replace(/\s+/g, ' ').split('');
    let i = startPosition;
    
    const playNext = () => {
      // Store current position for pause/resume
      pausedPositionRef.current = i;
      
      if (i >= symbols.length || !isPlayingRef.current) {
        isPlayingRef.current = false;
        isPausedRef.current = false;
        setIsPlaying(false);
        setIsPaused(false);
        return;
      }
      
      // Check if we're paused
      if (isPausedRef.current) {
        return;
      }
      
      const symbol = symbols[i];
      i++;
      
      if (symbol === ' ') {
        // Word gap
        playTimeoutRef.current = setTimeout(() => {
          playNext();
        }, WORD_GAP / speed);
      } else if (symbol === '/') {
        // Letter gap
        playTimeoutRef.current = setTimeout(() => {
          playNext();
        }, LETTER_GAP / speed);
      } else {
        // Dot or dash
        playSymbol(symbol, playNext);
      }
    };
    
    playNext();
  };

  // Pause playback
  const pausePlayback = () => {
    isPlayingRef.current = false;
    isPausedRef.current = true;
    setIsPlaying(false);
    setIsPaused(true);
    
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    
    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    
    // Stop visual signal
    setVisualActive(false);
  };

  // Resume playback
  const resumePlayback = () => {
    playMorseSequence(morseSequenceRef.current, pausedPositionRef.current);
  };

  // Start, pause, or stop playback
  const togglePlayback = () => {
    if (isPlaying) {
      pausePlayback();
    } else if (isPaused) {
      resumePlayback();
    } else {
      playMorseSequence(activeTab === 'text-to-morse' ? outputMorse : inputMorse);
    }
  };

  // Stop playback
  const stopPlayback = () => {
    isPlayingRef.current = false;
    isPausedRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    
    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    
    // Stop visual signal
    setVisualActive(false);
    
    // Reset position
    pausedPositionRef.current = 0;
  };

  // Copy output to clipboard
  const handleCopy = async () => {
    const textToCopy = activeTab === 'text-to-morse' ? outputMorse : outputText;
    if (!textToCopy) {
      toast({ title: 'Nothing to copy', description: 'Output is empty.', variant: 'destructive' });
      return;
    }
    await navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Copied to clipboard' });
  };

  // Clear all fields
  const handleClear = () => {
    if (activeTab === 'text-to-morse') {
      setInputText('');
      setOutputMorse('');
    } else {
      setInputMorse('');
      setOutputText('');
    }
    stopPlayback();
  };

  // Import text from file
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      if (activeTab === 'text-to-morse') {
        setInputText(text.replace(/\r\n?/g, '\n'));
      } else {
        setInputMorse(text.replace(/\r\n?/g, '\n'));
      }
      toast({ title: 'File imported successfully' });
    } catch (error) {
      toast({ title: 'Import failed', description: 'Could not read the file.', variant: 'destructive' });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Export output to file
  const handleExport = () => {
    const textToExport = activeTab === 'text-to-morse' ? outputMorse : outputText;
    if (!textToExport) {
      toast({ title: 'Nothing to export', description: 'Output is empty.', variant: 'destructive' });
      return;
    }
    
    const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'text-to-morse' ? 'morse-code.txt' : 'decoded-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'File exported' });
  };

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Morse Code Generator</h1>
            </div>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 lg:pb-24">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Morse Code Generator</h1>
              <p className="text-lg text-muted-foreground">Convert between text and Morse code with audio, vibration, and visual signals.</p>
            </div>

            {/* Tabs for Text-to-Morse and Morse-to-Text */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text-to-morse" className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Text to Morse
                </TabsTrigger>
                <TabsTrigger value="morse-to-text" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Morse to Text
                </TabsTrigger>
              </TabsList>
              
              {/* Text to Morse Tab */}
              <TabsContent value="text-to-morse" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Input */}
                  <Card className="flex flex-col overflow-hidden">
                    <CardHeader>
                      <CardTitle>Input Text</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea 
                        placeholder="Enter text to convert to Morse code..." 
                        value={inputText} 
                        onChange={(e) => setInputText(e.target.value)} 
                        className="resize-none min-h-[200px]" 
                      />
                      <div className="flex flex-wrap gap-2">
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept=".txt,text/plain" 
                          className="hidden" 
                          onChange={handleImport} 
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" /> Import
                        </Button>
                        <Button variant="outline" onClick={handleClear}>
                          <Trash2 className="h-4 w-4 mr-2" /> Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Output */}
                  <Card className="flex flex-col">
                    <CardHeader>
                      <CardTitle>Morse Code</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea 
                        placeholder="Morse code will appear here..." 
                        value={outputMorse} 
                        readOnly 
                        className="resize-none bg-muted/50 min-h-[200px] font-mono" 
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleCopy} disabled={!outputMorse}>
                          <Copy className="h-4 w-4 mr-2" /> Copy
                        </Button>
                        <Button onClick={handleExport} disabled={!outputMorse}>
                          <Download className="h-4 w-4 mr-2" /> Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Morse to Text Tab */}
              <TabsContent value="morse-to-text" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Input */}
                  <Card className="flex flex-col overflow-hidden">
                    <CardHeader>
                      <CardTitle>Morse Code</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea 
                        placeholder="Enter Morse code to decode (use . for dots, - for dashes, spaces between letters, / between words)..." 
                        value={inputMorse} 
                        onChange={(e) => setInputMorse(e.target.value)} 
                        className="resize-none min-h-[200px] font-mono" 
                      />
                      <div className="flex flex-wrap gap-2">
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept=".txt,text/plain" 
                          className="hidden" 
                          onChange={handleImport} 
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" /> Import
                        </Button>
                        <Button variant="outline" onClick={handleClear}>
                          <Trash2 className="h-4 w-4 mr-2" /> Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Output */}
                  <Card className="flex flex-col">
                    <CardHeader>
                      <CardTitle>Decoded Text</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea 
                        placeholder="Decoded text will appear here..." 
                        value={outputText} 
                        readOnly 
                        className="resize-none bg-muted/50 min-h-[200px]" 
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleCopy} disabled={!outputText}>
                          <Copy className="h-4 w-4 mr-2" /> Copy
                        </Button>
                        <Button onClick={handleExport} disabled={!outputText}>
                          <Download className="h-4 w-4 mr-2" /> Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Playback Controls */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Playback Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Signal Display */}
                {visualEnabled && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <Label>Visual Signal</Label>
                    </div>
                    <div 
                      ref={visualRef}
                      className={`w-full h-24 rounded-lg flex items-center justify-center transition-all duration-100 ${
                        visualActive 
                          ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' 
                          : 'bg-muted border-2 border-dashed'
                      }`}
                    >
                      {visualActive ? (
                        <span className="text-2xl font-bold text-yellow-900">●</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Signal will appear here during playback</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={togglePlayback} 
                      disabled={activeTab === 'text-to-morse' ? !outputMorse : !inputMorse}
                      className="flex items-center gap-2"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4" /> Pause
                        </>
                      ) : isPaused ? (
                        <>
                          <Play className="h-4 w-4" /> Resume
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" /> Play
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={stopPlayback} 
                      disabled={!isPlaying && !isPaused}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <StopCircle className="h-4 w-4" /> Stop
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4" />
                    <Label htmlFor="audio-toggle">Audio</Label>
                    <Switch
                      id="audio-toggle"
                      checked={audioEnabled}
                      onCheckedChange={setAudioEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4" />
                    <Label htmlFor="vibration-toggle">Vibration</Label>
                    <Switch
                      id="vibration-toggle"
                      checked={vibrationEnabled}
                      onCheckedChange={setVibrationEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <Label htmlFor="visual-toggle">Visual</Label>
                    <Switch
                      id="visual-toggle"
                      checked={visualEnabled}
                      onCheckedChange={setVisualEnabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Volume Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="volume" className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" /> Volume
                      </Label>
                      <span className="text-sm text-muted-foreground">{Math.round(volume * 100)}%</span>
                    </div>
                    <Slider
                      id="volume"
                      min={0}
                      max={1}
                      step={0.01}
                      value={[volume]}
                      onValueChange={([value]) => setVolume(value)}
                      disabled={!audioEnabled}
                    />
                  </div>

                  {/* Pitch Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="pitch" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Pitch
                      </Label>
                      <span className="text-sm text-muted-foreground">{pitch}Hz</span>
                    </div>
                    <Slider
                      id="pitch"
                      min={200}
                      max={2000}
                      step={50}
                      value={[pitch]}
                      onValueChange={([value]) => setPitch(value)}
                      disabled={!audioEnabled}
                    />
                  </div>

                  {/* Speed Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="speed" className="flex items-center gap-2">
                        <Play className="h-4 w-4" /> Speed
                      </Label>
                      <span className="text-sm text-muted-foreground">{speed.toFixed(1)}x</span>
                    </div>
                    <Slider
                      id="speed"
                      min={0.5}
                      max={3}
                      step={0.1}
                      value={[speed]}
                      onValueChange={([value]) => setSpeed(value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Languages className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Text to Morse:</strong> Enter text in the input field and see the Morse code translation. Use the Play button to hear/feel/see the Morse code.</span>
                </p>
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Code className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Morse to Text:</strong> Enter Morse code using dots (.) and dashes (-). Separate letters with spaces and words with / or double spaces.</span>
                </p>
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Settings className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Controls:</strong> Adjust volume, pitch, and speed of the audio playback. Enable vibration and visual signals for mobile devices.</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}