import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Send, MessageSquare, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Chef {
  id: string;
  phone_number: string;
  notification_opt_in: boolean;
  user_id: string;
  profiles?: {
    name: string;
  };
}

interface NotificationLog {
  id: string;
  chef_id: string;
  phone_number: string;
  message: string;
  status: string;
  created_at: string;
}

const AdminSMSPanel = () => {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);

  // Test SMS form
  const [testForm, setTestForm] = useState({
    meal_title: "Butter Chicken",
    quantity: 2,
    ready_time: "2:00 PM",
    earning: 150,
  });

  const [customForm, setCustomForm] = useState({
    phone_number: "",
    message: "",
  });

  useEffect(() => {
    fetchChefs();
    fetchLogs();
  }, []);

  const fetchChefs = async () => {
    try {
      const { data, error } = await supabase
        .from("chefs")
        .select(`
          id,
          phone_number,
          notification_opt_in,
          user_id,
          profiles:profiles(name)
        `)
        .not("phone_number", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChefs(data || []);
    } catch (error) {
      console.error("Error fetching chefs:", error);
      toast.error("Failed to load chefs");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const sendTestSMS = async (chef: Chef) => {
    if (!chef.phone_number) {
      toast.error("Chef has no phone number");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-sms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            phone_number: chef.phone_number,
            chef_id: chef.id,
            meal_title: testForm.meal_title,
            quantity: testForm.quantity,
            ready_time: testForm.ready_time,
            earning: testForm.earning,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`SMS sent to ${chef.phone_number}`);
        setSelectedChef(null);
        // Refresh logs
        setTimeout(fetchLogs, 1000);
      } else {
        toast.error(`Failed to send SMS: ${result.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      toast.error(error.message || "Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  const sendCustomSMS = async () => {
    if (!customForm.phone_number || !customForm.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-sms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            phone_number: customForm.phone_number,
            chef_id: "custom-test",
            meal_title: "Custom Test",
            quantity: 1,
            ready_time: "Now",
            earning: 0,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`SMS sent to ${customForm.phone_number}`);
        setCustomForm({ phone_number: "", message: "" });
        setTimeout(fetchLogs, 1000);
      } else {
        toast.error(`Failed to send SMS: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin - SMS Testing Panel</h1>
          <p className="text-muted-foreground">
            Send test SMS notifications to chefs and view notification logs
          </p>
        </div>

        <div className="grid gap-6">
          {/* Quick Send to Chef */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Test SMS to Chef
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading chefs...</p>
              ) : chefs.length === 0 ? (
                <div className="text-center py-4 space-y-1">
                  <p className="text-muted-foreground font-medium">No chefs have a phone number saved yet</p>
                  <p className="text-xs text-muted-foreground">Chefs need to add their phone number in their profile before they appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Select Chef</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {chefs.map((chef) => (
                        <Dialog key={chef.id}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="justify-start"
                              onClick={() => setSelectedChef(chef)}
                            >
                              <span className="truncate">
                                {chef.phone_number}
                              </span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Test SMS</DialogTitle>
                              <DialogDescription>
                                Phone: {chef.phone_number}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="meal_title">Meal Title</Label>
                                <Input
                                  id="meal_title"
                                  value={testForm.meal_title}
                                  onChange={(e) =>
                                    setTestForm({
                                      ...testForm,
                                      meal_title: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Butter Chicken"
                                />
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label htmlFor="quantity">Qty</Label>
                                  <Input
                                    id="quantity"
                                    type="number"
                                    value={testForm.quantity}
                                    onChange={(e) =>
                                      setTestForm({
                                        ...testForm,
                                        quantity: parseInt(e.target.value) || 1,
                                      })
                                    }
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="ready_time">Ready Time</Label>
                                  <Input
                                    id="ready_time"
                                    value={testForm.ready_time}
                                    onChange={(e) =>
                                      setTestForm({
                                        ...testForm,
                                        ready_time: e.target.value,
                                      })
                                    }
                                    placeholder="2:00 PM"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="earning">Earning ₹</Label>
                                  <Input
                                    id="earning"
                                    type="number"
                                    value={testForm.earning}
                                    onChange={(e) =>
                                      setTestForm({
                                        ...testForm,
                                        earning: parseFloat(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              <Button
                                onClick={() => sendTestSMS(chef)}
                                disabled={sending}
                                className="w-full"
                              >
                                {sending ? "Sending..." : "Send SMS"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom SMS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send Custom SMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={customForm.phone_number}
                    onChange={(e) =>
                      setCustomForm({
                        ...customForm,
                        phone_number: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter custom message..."
                    rows={4}
                    value={customForm.message}
                    onChange={(e) =>
                      setCustomForm({ ...customForm, message: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    SMS preview: {customForm.message.length} characters
                  </p>
                </div>

                <Button
                  onClick={sendCustomSMS}
                  disabled={sending}
                  className="w-full"
                >
                  {sending ? "Sending..." : "Send Custom SMS"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Notification Logs</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchLogs}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No notifications sent yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="max-w-xs">Message</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {log.phone_number}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.status)}
                              <Badge
                                variant={
                                  log.status === "sent"
                                    ? "default"
                                    : log.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {log.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm">
                            {log.message}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminSMSPanel;
