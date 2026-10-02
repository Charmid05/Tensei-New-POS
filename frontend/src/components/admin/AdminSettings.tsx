import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Database, 
  Bell,
  Globe,
  DollarSign,
  Printer,
  Save,
  RotateCcw
} from 'lucide-react'

export function AdminSettings() {
  const [settings, setSettings] = useState({
    restaurant_name: 'My Restaurant',
    currency: 'USD',
    tax_rate: '10.00',
    service_charge: '5.00',
    receipt_header: 'Thank you for dining with us!',
    receipt_footer: 'Visit again soon!',
    notification_email: 'admin@restaurant.com',
    backup_frequency: 'daily',
    theme: 'light',
    language: 'en'
  })

  const handleSave = () => {
    // TODO: Implement settings save
    console.log('Saving settings:', settings)
    alert('Settings saved successfully!')
  }

  const handleReset = () => {
    // Reset to defaults
    setSettings({
      restaurant_name: 'My Restaurant',
      currency: 'USD',
      tax_rate: '10.00',
      service_charge: '5.00',
      receipt_header: 'Thank you for dining with us!',
      receipt_footer: 'Visit again soon!',
      notification_email: 'admin@restaurant.com',
      backup_frequency: 'daily',
      theme: 'light',
      language: 'en'
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Configure your restaurant's POS system settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Restaurant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Restaurant Information
            </CardTitle>
            <CardDescription>
              Basic information about your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Restaurant Name</label>
              <Input
                value={settings.restaurant_name}
                onChange={(e) => setSettings({...settings, restaurant_name: e.target.value})}
                placeholder="Enter restaurant name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <select
                className="w-full p-2 border border-input rounded-md bg-background"
                value={settings.language}
                onChange={(e) => setSettings({...settings, language: e.target.value})}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Settings
            </CardTitle>
            <CardDescription>
              Configure currency, taxes, and charges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Currency</label>
              <select
                className="w-full p-2 border border-input rounded-md bg-background"
                value={settings.currency}
                onChange={(e) => setSettings({...settings, currency: e.target.value})}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tax Rate (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.tax_rate}
                  onChange={(e) => setSettings({...settings, tax_rate: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Service Charge (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.service_charge}
                  onChange={(e) => setSettings({...settings, service_charge: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Receipt Settings
            </CardTitle>
            <CardDescription>
              Customize receipt appearance and messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Receipt Header</label>
              <Input
                value={settings.receipt_header}
                onChange={(e) => setSettings({...settings, receipt_header: e.target.value})}
                placeholder="Header message"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Receipt Footer</label>
              <Input
                value={settings.receipt_footer}
                onChange={(e) => setSettings({...settings, receipt_footer: e.target.value})}
                placeholder="Footer message"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              System behavior and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Theme</label>
              <select
                className="w-full p-2 border border-input rounded-md bg-background"
                value={settings.theme}
                onChange={(e) => setSettings({...settings, theme: e.target.value})}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Backup Frequency</label>
              <select
                className="w-full p-2 border border-input rounded-md bg-background"
                value={settings.backup_frequency}
                onChange={(e) => setSettings({...settings, backup_frequency: e.target.value})}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Notification Email</label>
              <Input
                type="email"
                value={settings.notification_email}
                onChange={(e) => setSettings({...settings, notification_email: e.target.value})}
                placeholder="admin@restaurant.com"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Low Stock Alerts</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Daily Reports</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">System Updates</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Error Notifications</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current system health and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="w-full">
                Database
              </Badge>
              <p className="text-sm text-green-600 mt-1">Connected</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="w-full">
                API Server
              </Badge>
              <p className="text-sm text-green-600 mt-1">Online</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="w-full">
                Backup Status
              </Badge>
              <p className="text-sm text-green-600 mt-1">Up to date</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="w-full">
                Version
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">v1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
