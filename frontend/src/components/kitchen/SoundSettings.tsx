import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, TestTube } from 'lucide-react';
import { kitchenSoundService, type SoundSettings, type SoundEvent } from '@/services/soundService';
import { cn } from '@/lib/utils';

interface SoundSettingsProps {
  className?: string;
  onClose?: () => void;
}

export function SoundSettings({ className, onClose }: SoundSettingsProps) {
  const [settings, setSettings] = useState<SoundSettings>(kitchenSoundService.getSettings());
  const [isTestingSound, setIsTestingSound] = useState<string | null>(null);

  useEffect(() => {
    // Load current settings when component mounts
    setSettings(kitchenSoundService.getSettings());
  }, []);

  const handleSettingChange = (key: keyof SoundSettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    kitchenSoundService.updateSettings({ [key]: value });
  };

  const handleVolumeChange = (value: number[]) => {
    const volume = value[0];
    handleSettingChange('volume', volume);
  };

  const testSound = async (type: SoundEvent['type']) => {
    if (isTestingSound) return;
    
    setIsTestingSound(type);
    try {
      await kitchenSoundService.testSound(type);
    } catch (error) {
      console.error('Failed to test sound:', error);
    } finally {
      setTimeout(() => setIsTestingSound(null), 1000);
    }
  };

  const soundTests = [
    {
      type: 'new_order' as const,
      label: 'New Order Alert',
      description: 'Plays when a new order is received',
      icon: '🆕',
    },
    {
      type: 'order_ready' as const,
      label: 'Order Ready Alert',
      description: 'Plays when an order is ready for pickup',
      icon: '✅',
    },
    {
      type: 'takeaway_ready' as const,
      label: 'Takeaway Ready Alert',
      description: 'Plays when a takeaway order is ready',
      icon: '📦',
    },
  ];

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Sound Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Sound Control */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Enable Sounds</Label>
            <p className="text-sm text-muted-foreground">
              Turn on/off all kitchen notifications (no microphone access required)
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
          />
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <Label className="text-base font-medium flex items-center gap-2">
            {settings.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Volume: {Math.round(settings.volume * 100)}%
          </Label>
          <Slider
            value={[settings.volume]}
            onValueChange={handleVolumeChange}
            max={1}
            min={0}
            step={0.1}
            disabled={!settings.enabled}
            className="w-full"
          />
        </div>

        {/* Individual Sound Controls */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Sound Types</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">New Orders</Label>
                <p className="text-xs text-muted-foreground">
                  Alert when new orders arrive
                </p>
              </div>
              <Switch
                checked={settings.newOrderEnabled && settings.enabled}
                onCheckedChange={(checked) => handleSettingChange('newOrderEnabled', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Order Ready</Label>
                <p className="text-xs text-muted-foreground">
                  Alert when orders are ready
                </p>
              </div>
              <Switch
                checked={settings.orderReadyEnabled && settings.enabled}
                onCheckedChange={(checked) => handleSettingChange('orderReadyEnabled', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Takeaway Ready</Label>
                <p className="text-xs text-muted-foreground">
                  Alert when takeaway orders are ready
                </p>
              </div>
              <Switch
                checked={settings.takeawayReadyEnabled && settings.enabled}
                onCheckedChange={(checked) => handleSettingChange('takeawayReadyEnabled', checked)}
                disabled={!settings.enabled}
              />
            </div>
          </div>
        </div>

        {/* Sound Test Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Test Sounds</Label>
          <div className="grid gap-2">
            {soundTests.map((sound) => (
              <Button
                key={sound.type}
                variant="outline"
                size="sm"
                onClick={() => testSound(sound.type)}
                disabled={!settings.enabled || isTestingSound !== null}
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{sound.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{sound.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {sound.description}
                    </div>
                  </div>
                  {isTestingSound === sound.type ? (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {onClose && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
